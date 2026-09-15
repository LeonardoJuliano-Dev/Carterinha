const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin para:
 * 1. Registar o serviço nativo RNAndroidNotificationListener no AndroidManifest.xml
 * 2. Configurar gradle.properties para forçar IPv4 e evitar erros de rede no download do SQLite
 * 3. Aumentar timeouts e tentativas de rede em expo-sqlite
 */
const withAndroidNotificationListener = (config) => {
  // Tentar aplicar patch preventivo no build.gradle do expo-sqlite se existir
  try {
    const projectRoot = config._internal?.projectRoot || process.cwd();
    const sqliteGradlePath = path.resolve(
      projectRoot,
      'node_modules/expo-sqlite/android/build.gradle'
    );
    if (fs.existsSync(sqliteGradlePath)) {
      let content = fs.readFileSync(sqliteGradlePath, 'utf8');
      if (!content.includes('localSqliteZip')) {
        const targetSnippet = `def downloadSQLite = tasks.register('downloadSQLite', Download) {`;
        const replacement = `def localSqliteZip = new File(project.rootDir, "../vendor/sqlite/sqlite-amalgamation-" + SQLITE_VERSION + ".zip")
def downloadSQLite = tasks.register('downloadSQLite', Download) {
  src(localSqliteZip.exists() ? localSqliteZip.toURI().toString() : "https://www.sqlite.org/2024/sqlite-amalgamation-" + SQLITE_VERSION + ".zip")`;
        content = content.replace(targetSnippet, replacement);
        content = content.replace(
          /src\("https:\/\/www\.sqlite\.org\/2024\/sqlite-amalgamation-\$\{SQLITE_VERSION\}\.zip"\)/g,
          '// original src replaced'
        );
      }
      if (!content.includes('connectTimeout(60000)')) {
        content = content.replace(
          /dest\(new File\(downloadsDir,\s*["']sqlite-amalgamation-\$\{SQLITE_VERSION\}\.zip["']\)\)/g,
          'dest(new File(downloadsDir, "sqlite-amalgamation-${SQLITE_VERSION}.zip"))\n  connectTimeout(60000)\n  readTimeout(120000)\n  retries(5)'
        );
      }
      fs.writeFileSync(sqliteGradlePath, content, 'utf8');
    }
  } catch (err) {
    console.warn('[withAndroidNotificationListener] Aviso ao aplicar patch expo-sqlite:', err.message);
  }

  // 1. Configuração do AndroidManifest
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Garantir o namespace xmlns:tools
    if (!androidManifest.manifest.$) {
      androidManifest.manifest.$ = {};
    }
    androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = androidManifest.manifest.application[0];
    if (!application.$) {
      application.$ = {};
    }

    // Resolver conflito do atributo allowBackup com a biblioteca de notificações
    const currentReplace = application.$['tools:replace'] || '';
    const replaceList = currentReplace ? currentReplace.split(',').map((s) => s.trim()) : [];
    if (!replaceList.includes('android:allowBackup')) {
      replaceList.push('android:allowBackup');
    }
    application.$['tools:replace'] = replaceList.join(',');
    application.$['android:allowBackup'] = 'true';

    if (!application.service) {
      application.service = [];
    }

    const serviceName = 'com.lesimoes.androidnotificationlistener.RNAndroidNotificationListener';
    const exists = application.service.some(
      (s) => s.$ && s.$['android:name'] === serviceName
    );

    if (!exists) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'CarterinhaNotificationListener',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // 2. Configuração do gradle.properties (IPv4 & estabilidade de rede)
  config = withGradleProperties(config, (config) => {
    const gradleProperties = config.modResults;

    // Forçar IPv4 no JVM Daemon
    const jvmArgs = gradleProperties.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs'
    );
    if (jvmArgs) {
      if (!jvmArgs.value.includes('-Djava.net.preferIPv4Stack=true')) {
        jvmArgs.value = `${jvmArgs.value} -Djava.net.preferIPv4Stack=true`;
      }
    } else {
      gradleProperties.push({
        type: 'property',
        key: 'org.gradle.jvmargs',
        value: '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Djava.net.preferIPv4Stack=true',
      });
    }

    // Definir systemProp para IPv4 e timeouts de rede HTTP no Gradle
    const setProp = (key, value) => {
      const prop = gradleProperties.find(
        (item) => item.type === 'property' && item.key === key
      );
      if (prop) {
        prop.value = value;
      } else {
        gradleProperties.push({ type: 'property', key, value });
      }
    };

    setProp('systemProp.java.net.preferIPv4Stack', 'true');
    setProp('systemProp.org.gradle.internal.http.socketTimeout', '300000');
    setProp('systemProp.org.gradle.internal.repository.max.retries', '10');

    return config;
  });

  return config;
};

module.exports = withAndroidNotificationListener;
