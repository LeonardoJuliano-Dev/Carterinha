const { spawn } = require('child_process');
const os = require('os');

/**
 * Obtém dinamicamente o endereço IPv4 ativo da máquina na rede local
 * sem necessidade de configurar nenhum IP manual.
 */
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const isIpv4 = net.family === 'IPv4' || net.family === 4;
      if (isIpv4 && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();
console.log(`[Carterinha] IP da rede local detetado automaticamente: ${localIp}`);

const env = {
  ...process.env,
  REACT_NATIVE_PACKAGER_HOSTNAME: localIp,
  EXPO_PUBLIC_AI_API_URL: `http://${localIp}:8000`,
};

// No Windows, usar cmd.exe /c para evitar o erro EINVAL do Node.js v22/v24 (CVE-2024-27980)
const cmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
const args = process.platform === 'win32'
  ? ['/c', 'npx', 'expo', 'start', '--host', 'lan', '-c', ...process.argv.slice(2)]
  : ['expo', 'start', '--host', 'lan', '-c', ...process.argv.slice(2)];

const child = spawn(cmd, args, {
  stdio: 'inherit',
  env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
