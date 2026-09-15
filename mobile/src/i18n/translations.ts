export type SupportedLanguage = 'pt' | 'en';

export interface Translations {
  // Navigation & Tabs
  navDashboard: string;
  navGoals: string;
  navFixedExpenses: string;
  navTransactions: string;
  navSettings: string;
  navNotifications: string;
  navAiAdvisor: string;
  more: string;

  // Common Actions
  save: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  back: string;
  done: string;
  loading: string;
  add: string;
  close: string;
  continue: string;
  selectFile: string;
  quickActions: string;
  newExpense: string;
  scanReceipt: string;
  priceComparison: string;
  smsBanks: string;

  // Dashboard
  availableBalance: string;
  ofTotalFunds: string;
  totalSpentThisMonth: string;
  activeFixedExpenses: string;
  estimatedFreeBalance: string;
  monthlyAllocation503020: string;
  essentialNeeds: string;
  lifestyleWants: string;
  savingsGoals: string;
  allocated: string;
  spent: string;
  freeLimit: string;
  spentOverLimit: string;
  recentTransactions: string;
  seeAll: string;
  noTransactionsYet: string;
  offlineMode: string;
  aiOfflineLocalData: string;
  newMonthCycle: string;
  setSalaryForMonth: string;
  setSalaryBtn: string;
  quickAddIncome: string;

  // Transactions Screen
  transactionsTitle: string;
  searchTransactions: string;
  filterAll: string;
  filterEssential: string;
  filterLifestyle: string;
  filterSavings: string;
  totalTransactions: string;
  noFilteredTransactions: string;
  deleteTransactionConfirm: string;

  // Settings
  settingsTitle: string;
  userProfile: string;
  budgetSplit: string;
  securityAndPin: string;
  appearanceAndLang: string;
  geminiAiKey: string;
  importData: string;
  exportData: string;
  lockNow: string;
  resetDatabase: string;
  resetDbConfirm: string;
  resetDbWarning: string;
  salaryMonthlyBase: string;
  initialWalletBalance: string;
  salaryDayHabitual: string;
  salaryFrequency: string;

  // Import / Export
  importTitle: string;
  importSubtitle: string;
  importLoading: string;
  importSuccess: string;
  importError: string;
  importInvalidFile: string;
  exportSuccess: string;

  // Appearance
  appearanceTitle: string;
  themeSelection: string;
  darkTheme: string;
  lightTheme: string;
  languageSelection: string;
  currencySelection: string;
  primaryColorSelection: string;
  realTimeExchange: string;
  exchangeUpdated: string;

  // Goals
  goalsTitle: string;
  newGoal: string;
  goalName: string;
  targetAmount: string;
  deadlineOptional: string;
  selectDate: string;
  completedGoals: string;
  activeGoals: string;
  depositInGoal: string;
  remainingAmount: string;
  goalCompleted: string;

  // Fixed Expenses
  fixedExpensesTitle: string;
  addFixedExpense: string;
  expenseName: string;
  expenseAmount: string;
  dueDay: string;
  expenseCategory: string;
  duplicateExpenseWarning: string;
  committedTotal: string;
  availableForVariables: string;
  recurringAccounts: string;
  payExpense: string;
  confirmPayment: string;

  // Security / Lock
  lockTitle: string;
  enterPin: string;
  unlockWithBiometrics: string;
  invalidPin: string;

  // Onboarding
  onboardingStep: string;
  onboardingPreferences: string;
  onboardingPreferencesDesc: string;
  onboardingPersonal: string;
  onboardingPersonalDesc: string;
  onboardingSecurity: string;
  onboardingSecurityDesc: string;
  onboardingIncome: string;
  onboardingIncomeDesc: string;
  onboardingBudget: string;
  onboardingBudgetDesc: string;
  finishSetup: string;
  nextStep: string;
  selectLanguageDropdown: string;
  selectCurrencyDropdown: string;
  fullName: string;
  emailAddress: string;
  create4DigitPin: string;
  confirmPin: string;
  enableBiometrics: string;
  monthlyNetSalary: string;
  initialBalanceOptional: string;

  // Modals & Forms
  modalTitleGoalNew: string;
  modalTitleGoalEdit: string;
  modalSubGoal: string;
  goalNameLabel: string;
  goalNamePlaceholder: string;
  targetAmountLabel: string;
  targetAmountPlaceholder: string;
  deadlineLabel: string;
  deadlineSelectCalendar: string;
  createGoalBtn: string;
  saveChangesBtn: string;
  errorGoalName: string;
  errorGoalTarget: string;

  depositTitle: string;
  depositSub: string;
  depositAmountLabel: string;
  depositNoteLabel: string;
  depositNotePlaceholder: string;
  depositQuickAdd: string;
  depositConfirmBtn: string;
  depositSuccess: string;
  depositErrorBalance: string;
  depositErrorExceed: string;

  deleteGoalTitle: string;
  deleteGoalDesc: string;
  refundWarning: string;
  refundToBalance: string;
  confirmDeleteBtn: string;

  goalHistoryTitle: string;
  totalSaved: string;
  depositsCount: string;
  noDepositsYet: string;

  newExpenseTitle: string;
  editExpenseTitle: string;
  scanReceiptTitle: string;
  scanReceiptSub: string;
  aiBadge: string;
  expenseAmountLabel: string;
  itemBoughtLabel: string;
  itemBoughtPlaceholder: string;
  storeLabel: string;
  storePlaceholder: string;
  essentialCategory: string;
  lifestyleCategory: string;
  savingsCategory: string;
  categoryLabel: string;
  saveExpenseBtn: string;
  updateExpenseBtn: string;
  errorExpenseAmount: string;
  errorExpenseDesc: string;

  salaryModalTitle: string;
  salaryNetLabel: string;
  simulationTitle: string;
  needs50Label: string;
  wants30Label: string;
  savings20Label: string;
  confirmDistributeSalary: string;
  errorSalaryValid: string;

  scannerTitle: string;
  scannerSubtitle: string;
  takePhoto: string;
  chooseGallery: string;
  processingReceipt: string;
  storeExtracted: string;
  totalExtracted: string;
  saveReceiptBtn: string;

  // Real Currency Exchange
  currencyConvertedTitle: string;
  currencyConvertedMsg: string;
  confirmExchangeTitle: string;
  confirmExchangeMsg: string;

  // Notifications & Reports
  notificationsTitle: string;
  tabMessages: string;
  tabSimulator: string;
  emptyNotifications: string;
  simulateSmsBtn: string;
  reportsTitle: string;
  tabWeekly: string;
  tabYearly: string;
  weeklyAverage: string;
  highestExpense: string;

  // Month selector
  selectMonthTitle: string;
  selectMonthSubtitle: string;
  currentMonthBadge: string;

  // Expense Chart
  expenseEvolution: string;
  weeklyEvolutionDesc: string;
  yearlyEvolutionDesc: string;
  weeks: string;
  yearly: string;
  totalInPeriod: string;
  averagePer: string;
  week: string;
  month: string;
  weekShort: string;

  // Receipt Scanner Modal extras
  receiptEmptySubtitle: string;
  camera: string;
  takePhotoNow: string;
  gallery: string;
  chooseImage: string;
  tipLighting: string;
  tipFraming: string;
  extractingAi: string;
  fewSecondsWait: string;
  dataExtractedSuccess: string;
  storeEstablishment: string;
  storeNamePlaceholder: string;
  totalAmount: string;
  itemsDetected: string;
  suggestedCategory: string;
  essential: string;
  lifestyle: string;
  receiptSavedSuccess: string;
  confirmAndSave: string;
  restartBtn: string;
  newPhotoBtn: string;

  // SMS Notification Modal extras
  smsModalTitle: string;
  smsModalSubtitle: string;
  autoSmsDetection: string;
  autoSmsDesc: string;
  enableAutoReadingBtn: string;
  pasteOrSimulate: string;
  smsPlaceholder: string;
  mozambiqueSamples: string;
  recipientOrStore: string;
  rule503020: string;
  saveThisExpense: string;
  transactionRecorded: string;

  // Notification Sources (Fontes de Notificações)
  tabSources: string;
  sourcesTitle: string;
  sourcesDesc: string;
  defaultSourcesLabel: string;
  customSourcesLabel: string;
  addCustomSourceLabel: string;
  addSourcePlaceholder: string;
  addSourceBtn: string;
  removeSource: string;
  sourceEnabledLabel: string;
  sourceDisabledLabel: string;
  sourceEmptyCustom: string;

  // Price Comparison Screen
  priceComparisonTitle: string;
  priceComparisonSubtitle: string;
  tabPriceHistory: string;
  tabPriceSimulator: string;
  tabStores: string;
  searchProductPlaceholder: string;
  popularItems: string;
  noPriceHistoryFound: string;
  bestPriceAt: string;
  averagePriceLabel: string;
  priceDifference: string;
  saveWithBestOption: string;
  simulatePurchase: string;

  // AI Advisor Screen
  advisorTitle: string;
  advisorSubtitle: string;
  advisorPlaceholder: string;
  budgetAnalysisPrompt: string;
  topSpendingPrompt: string;
  whereToCutPrompt: string;
  reviewGoalsPrompt: string;
  thinkingAi: string;
  onlineMlStatus: string;
  offlineAiStatus: string;
  clearChatHistory: string;
  placeholderExpenseName: string;
  placeholderExpenseAmount: string;
  placeholderExpenseDay: string;
  placeholderSmsPaste: string;
  placeholderSearchItem: string;
  placeholderItemName: string;
  placeholderStoreName: string;
  placeholderAiAdvisor: string;
  placeholderCustomDeposit: string;
  placeholderFixedExpenseName: string;
  placeholderFixedExpenseAmount: string;
  placeholderFixedExpenseDay: string;
  placeholderDeleteGoalReason: string;
  placeholderAiKey: string;
  biometricFingerprint: string;
  biometricFaceId: string;
  unlockPrompt: string;
  usePin: string;
  resetAppTitle: string;
  resetAppDesc: string;
  cancelReset: string;
  yesResetAll: string;
  welcomeUser: string;
  touchSensorOrPin: string;
  authWithBiometrics: string;
  digitalLabel: string;
  eraseDigit: string;
  eraseLabel: string;
  forgotPinLabel: string;
  resetDataAction: string;
  errIncompleteTitle: string;
  errIncompleteDesc: string;
  errInvalidPinTitle: string;
  errInvalidPinDesc: string;
  errPinMismatchTitle: string;
  errPinMismatchDesc: string;
  errInvalidSalaryTitle: string;
  errInvalidSalaryDesc: string;
  errSumPercentTitle: string;
  errSumPercentDesc: string;
  onboardingBrandSubtitle: string;
  namePlaceholder: string;
  biometricsDesc: string;
  baseCalculationIn: string;
  needsHint: string;
  wantsHint: string;
  savingsHint: string;
  pinPlaceholder: string;
  amountPlaceholder: string;

  // Settings & Profile additions
  settingsAndProfile: string;
  editProfileSettings: string;
  accountSection: string;
  preferencesSection: string;
  securityMenuLabel: string;
  budgetSplitMenuLabel: string;
  salaryCycleMenuLabel: string;
  salaryPayDayOn: string;
  monthly: string;
  biweekly: string;
  bimonthly: string;
  fixedExpensesAndCategories: string;
  aiAdvisorMenuLabel: string;
  smsBanksMenuLabel: string;
  priceComparisonMenuLabel: string;
  appearanceMenuLabel: string;
  aiGeminiMenuLabel: string;
  aiGeminiSubLabel: string;
  lockAppNow: string;
  resetDatabaseBtn: string;
  resetDatabaseTitle: string;
  resetDatabaseDesc: string;
  yesClearAll: string;
  dbResetSuccess: string;
  editProfileModalTitle: string;
  fullNameLabel: string;
  salaryFrequencyLabel: string;
  profileSaveSuccess: string;
  budgetSplitModalTitle: string;
  budgetSplitModalSubtitle: string;
  needsPercentLabel: string;
  wantsPercentLabel: string;
  savingsPercentLabel: string;
  apply: string;
  budgetUpdatedSuccess: string;
  budgetSum100Alert: string;
  appSecurityTitle: string;
  pin4DigitsLabel: string;
  savePinBtn: string;
  pinConfigSuccess: string;
  pinRemovedSuccess: string;
  pinInvalidLength: string;
  aiDirectModalTitle: string;
  aiDirectModalSubtitle: string;
  activeModels: string;
  activeModelsDesc: string;
  googleGeminiKeyLabel: string;
  testConnectionBtn: string;
  testingConnectionBtn: string;
  restoreDefaultBtn: string;
  saveKeyBtn: string;
  keySavedSuccess: string;
  keyRestoredSuccess: string;
  aiDirectSuccessTitle: string;
  aiDirectSuccessMsg: string;
  importDatabaseTitle: string;
  importCompleteTitle: string;
  importDatabaseSubtitle: string;
  selectFileBtn: string;
  restoringDatabaseMsg: string;
  redirectToSecurityPinMsg: string;
  continueToPinBtn: string;
  fileEmptyOrUnreadable: string;
  errorImportingFile: string;
  cannotExportData: string;

  // Goals screen & modals additions
  noActiveGoals: string;
  noActiveGoalsSub: string;
  completedBadge: string;
  viewHistoryBtn: string;
  otherAmountBtn: string;
  goalCompletedBanner: string;
  quickDepositNoGoal: string;
  quickDepositExceeds: string;
  quickDepositSaved: string;
  quickDepositSuccessMsg: string;
  accumulatedProgress: string;
  goalAchievedBadge: string;
  completedPercentSuffix: string;
  totalTargetLabel: string;
  remainingLabel: string;
  createdAtLabel: string;
  targetDeadlineLabel: string;
  noDeadlineLabel: string;
  initialAccumulatedBalance: string;
  savedAtOpeningDesc: string;
  noDepositsAssociatedDesc: string;
  depositForGoalDesc: string;
  consultWithAiBtn: string;
  reasonGoalAchieved: string;
  reasonPriorityChange: string;
  reasonEmergency: string;
  reasonMistake: string;
  reasonOther: string;
  accumulatedBalanceWarning: string;
  accumulatedBalanceWarningDesc: string;
  confirmDeleteGoalDesc: string;
  deleteReasonPlaceholder: string;
  confirmDeleteGoalBtn: string;
  goalDeletedSuccess: string;
  goal100Completed: string;
  accumulatedAmountLabel: string;
  ofTargetLabel: string;
  availableAccountBalance: string;
  errDepositValidAmount: string;
  errGoalAlreadyCompleted: string;
  errDepositExceedsRemaining: string;
  confirmDepositBtn: string;
  goalAlreadyDoneBtn: string;
  errorProcessingGoal: string;

  // Fixed Expenses screen & component additions
  noFixedExpenses: string;
  noFixedExpensesSub: string;
  newFixedExpenseBtn: string;
  paidBadge: string;
  dueOnDay: string;
  saveAccountBtn: string;
  accountAlreadyExists: string;
  accountAlreadyExistsDesc: string;
  confirmFixedPayDesc: string;
  fixedPaidSuccess: string;
  deleteFixedConfirm: string;
  dueDayFieldLabel: string;
  fixedExpensesEssential: string;
  predictableMonthlyCommitments: string;
  newShort: string;
  dueDayBadge: string;
  fixedExpensesCommittedDesc: string;
  addFixedExpenseSub: string;
  dueDebitDayLabel: string;
  saveFixedExpenseBtn: string;

  // Appearance additions
  selectLanguageTitle: string;
  selectCurrencyTitle: string;

  // Transaction Modal Fixed Validation
  fixedValidationTitle: string;
  fixedValidationSub: string;
  changeToLifestyleRecommended: string;
  addToRecurringFixed: string;
  keepAsOneTimeFixed: string;

  // Lock & Security & Onboarding additions
  stepOf: string;
  encryptedVault: string;
  localFirstBadge: string;
  loadingCarterinha: string;
  spendingPerWeek: string;
  share: string;
  monthlyOverview: string;
  salaryModalSubDefault: string;
  salaryModalSubMonth: string;
  incomeForMonth: string;
  errorRegisterSalary: string;
  reportShareHeader: string;
  reportShareMonth: string;
  reportShareTotalSpent: string;
  reportShareEssentials: string;
  reportShareLifestyle: string;
  reportShareFooter: string;

  // Fixed Expenses Categories & Actions
  catHousing: string;
  catUtilities: string;
  catTelecom: string;
  catHealth: string;
  catOther: string;
  selectCategory: string;
  errorTitle: string;
  errorPayFixedExpense: string;

  // Budget Cards Allocation
  essentialNeedsSub: string;
  lifestyleWantsSub: string;
  savingsGoalsSub: string;
  noSalaryRegisteredThisMonth: string;
  registerIncomeFor503020: string;
  monthlyAllocationHeader: string;
  spentLabel: string;
  availableLabel: string;
  monthlyCeilingLabel: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  pt: {
    navDashboard: 'Início',
    navGoals: 'Metas',
    navFixedExpenses: 'Despesas Fixas',
    navTransactions: 'Transações',
    navSettings: 'Definições',
    navNotifications: 'Notificações',
    navAiAdvisor: 'Consultor IA',
    more: 'Mais',

    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Remover',
    edit: 'Editar',
    back: 'Voltar',
    done: 'Concluído',
    loading: 'A carregar...',
    add: 'Adicionar',
    close: 'Fechar',
    continue: 'Continuar',
    selectFile: 'Selecionar ficheiro',
    quickActions: 'Ações Rápidas',
    newExpense: 'Nova Despesa',
    scanReceipt: 'Ler Fatura',
    priceComparison: 'Preços',
    smsBanks: 'SMS & Bancos',

    availableBalance: 'Saldo disponível',
    ofTotalFunds: 'de',
    totalSpentThisMonth: 'Total gasto este mês',
    activeFixedExpenses: 'Fixas ativas',
    estimatedFreeBalance: 'Saldo livre estimado',
    monthlyAllocation503020: 'Divisão Orçamental (50/30/20)',
    essentialNeeds: 'Necessidades Fixas',
    lifestyleWants: 'Estilo de Vida & Lazer',
    savingsGoals: 'Poupanças & Metas',
    allocated: 'Alocado',
    spent: 'Gasto',
    freeLimit: 'Livre',
    spentOverLimit: 'Excedido',
    recentTransactions: 'Últimas Transações',
    seeAll: 'Ver Todas',
    noTransactionsYet: 'Nenhuma transação registada este mês.',
    offlineMode: 'Sem ligação à Internet — modo offline',
    aiOfflineLocalData: 'Consultor IA indisponível — dados guardados localmente',
    newMonthCycle: 'Novo Ciclo',
    setSalaryForMonth: 'Define o rendimento deste mês para calcular o orçamento 50/30/20.',
    setSalaryBtn: 'Definir Salário',
    quickAddIncome: 'Registar Rendimento',

    transactionsTitle: 'Transações',
    searchTransactions: 'Pesquisar transação...',
    filterAll: 'Todas',
    filterEssential: 'Fixas (50%)',
    filterLifestyle: 'Lazer (30%)',
    filterSavings: 'Poupanças (20%)',
    totalTransactions: 'Total de Movimentos',
    noFilteredTransactions: 'Nenhuma transação encontrada neste filtro.',
    deleteTransactionConfirm: 'Tens a certeza que desejas eliminar esta transação?',

    settingsTitle: 'Definições & Perfil',
    userProfile: 'Perfil de Utilizador',
    budgetSplit: 'Divisão Orçamental (50/30/20)',
    securityAndPin: 'Segurança & Código PIN',
    appearanceAndLang: 'Aparência & Idioma',
    geminiAiKey: 'Chave Gemini IA Direta',
    importData: 'Importar dados',
    exportData: 'Exportar dados',
    lockNow: 'Bloquear Aplicação Agora',
    resetDatabase: 'Repor Todos os Dados a Zero',
    resetDbConfirm: 'Tens a certeza de que desejas apagar todos os registos locais?',
    resetDbWarning: 'Esta ação não pode ser desfeita.',
    salaryMonthlyBase: 'SALÁRIO / RENDIMENTO BASE MENSAL',
    initialWalletBalance: 'SALDO INICIAL DA CARTEIRA',
    salaryDayHabitual: 'DIA HABITUAL DE RECEBIMENTO (1-31)',
    salaryFrequency: 'FREQUÊNCIA DE RENDIMENTO',

    importTitle: 'Importar Base de Dados',
    importSubtitle: 'Seleciona o ficheiro JSON exportado anteriormente para restaurar os teus dados financeiros.',
    importLoading: 'A restaurar a base de dados SQLite...',
    importSuccess: 'Base de dados restaurada com sucesso. Insere o PIN da base importada para aceder.',
    importError: 'Falha ao restaurar os dados.',
    importInvalidFile: 'O ficheiro selecionado não contém um formato de cópia de segurança válido.',
    exportSuccess: 'Dados exportados com sucesso!',

    appearanceTitle: 'Aparência & Preferências',
    themeSelection: 'Modo de Exibição',
    darkTheme: 'Modo Escuro Galaxy',
    lightTheme: 'Modo Claro Cristalino',
    languageSelection: 'Idioma do Sistema',
    currencySelection: 'Moeda Principal',
    primaryColorSelection: 'Cor de Destaque',
    realTimeExchange: 'Câmbio em Tempo Real',
    exchangeUpdated: 'Atualizado em',

    goalsTitle: 'Metas Financeiras',
    newGoal: 'Nova Meta de Vida',
    goalName: 'Nome da Meta',
    targetAmount: 'Valor Alvo',
    deadlineOptional: 'Data Limite Prevista (Opcional)',
    selectDate: 'Escolher no Calendário',
    completedGoals: 'Metas Concluídas',
    activeGoals: 'Metas em Progresso',
    depositInGoal: 'Depositar na Meta',
    remainingAmount: 'Faltam',
    goalCompleted: 'Meta Concluída!',

    fixedExpensesTitle: 'Despesas Fixas (50%)',
    addFixedExpense: 'Adicionar Conta Fixa',
    expenseName: 'Nome da Conta',
    expenseAmount: 'Valor Mensal',
    dueDay: 'Dia de Vencimento',
    expenseCategory: 'Categoria',
    duplicateExpenseWarning: 'Já tens uma despesa fixa com esse nome.',
    committedTotal: 'Comprometido em Contas Fixas',
    availableForVariables: 'Livre para Gastos Variáveis',
    recurringAccounts: 'Contas Recorrentes',
    payExpense: 'Pagar Conta',
    confirmPayment: 'Confirmar Pagamento',

    lockTitle: 'Segurança & Palavra-passe (Criptografado)',
    enterPin: 'Introduza o seu PIN / Palavra-passe de 4 dígitos',
    unlockWithBiometrics: 'Desbloquear com Biometria',
    invalidPin: 'PIN incorreto. Tenta novamente.',

    onboardingStep: 'PASSO',
    onboardingPreferences: 'Preferências',
    onboardingPreferencesDesc: 'Escolhe o teu idioma e moeda base para personalizar a experiência.',
    onboardingPersonal: 'Identificação Pessoal',
    onboardingPersonalDesc: 'Como gostarias de ser chamado no aplicativo?',
    onboardingSecurity: 'Segurança & Palavra-passe',
    onboardingSecurityDesc: 'Protege as tuas finanças com um código PIN ou palavra-passe de 4 dígitos.',
    onboardingIncome: 'Rendimento & Salário',
    onboardingIncomeDesc: 'Informa o teu rendimento mensal para calibrar o método 50/30/20.',
    onboardingBudget: 'Divisão Orçamental',
    onboardingBudgetDesc: 'Personaliza a distribuição percentual da tua carteira.',
    finishSetup: 'Concluir & Entrar',
    nextStep: 'Próximo Passo',
    selectLanguageDropdown: 'Selecionar Idioma',
    selectCurrencyDropdown: 'Selecionar Moeda Base',
    fullName: 'NOME COMPLETO',
    emailAddress: 'ENDEREÇO DE E-MAIL',
    create4DigitPin: 'CRIAR PIN / PALAVRA-PASSE (4 DÍGITOS)',
    confirmPin: 'CONFIRMAR PIN / PALAVRA-PASSE',
    enableBiometrics: 'Ativar autenticação por Biometria',
    monthlyNetSalary: 'SALÁRIO LÍQUIDO MENSAL',
    initialBalanceOptional: 'SALDO INICIAL DA CARTEIRA (OPCIONAL)',

    modalTitleGoalNew: 'Nova Meta de Vida',
    modalTitleGoalEdit: 'Editar Meta de Vida',
    modalSubGoal: 'Define objetivos de poupança ou investimentos',
    goalNameLabel: 'NOME DA META',
    goalNamePlaceholder: 'Ex: Fundo de Emergência, Carro, Viagem',
    targetAmountLabel: 'VALOR ALVO TOTAL',
    targetAmountPlaceholder: 'Ex: 50.000,00',
    deadlineLabel: 'DATA LIMITE PREVISTA (OPCIONAL)',
    deadlineSelectCalendar: 'Selecionar data no calendário',
    createGoalBtn: 'Criar Meta de Vida',
    saveChangesBtn: 'Guardar Alterações',
    errorGoalName: 'Por favor, introduz o nome da meta.',
    errorGoalTarget: 'Por favor, introduz um valor alvo válido e positivo.',

    depositTitle: 'Depositar na Meta',
    depositSub: 'Aloca fundos para o teu objetivo financeiro',
    depositAmountLabel: 'VALOR DO DEPÓSITO',
    depositNoteLabel: 'NOTA ADICIONAL (OPCIONAL)',
    depositNotePlaceholder: 'Ex: Bónus do trabalho, poupança extra',
    depositQuickAdd: 'Adição Rápida',
    depositConfirmBtn: 'Confirmar Depósito',
    depositSuccess: 'Depósito registado com sucesso!',
    depositErrorBalance: 'Saldo disponível insuficiente na carteira.',
    depositErrorExceed: 'O valor excede o montante restante para concluir a meta.',

    deleteGoalTitle: 'Eliminar Meta',
    deleteGoalDesc: 'Tens a certeza de que desejas eliminar esta meta?',
    refundWarning: 'O montante já poupado nesta meta será devolvido ao teu saldo disponível.',
    refundToBalance: 'Devolver valor poupado ao saldo disponível',
    confirmDeleteBtn: 'Eliminar Meta Definitivamente',

    goalHistoryTitle: 'Histórico de Depósitos',
    totalSaved: 'Total Poupado',
    depositsCount: 'Depósitos Efetuados',
    noDepositsYet: 'Ainda não foram efetuados depósitos nesta meta.',

    newExpenseTitle: 'Registar Nova Despesa',
    editExpenseTitle: 'Editar Despesa',
    scanReceiptTitle: 'Digitalizar Fatura / Recibo',
    scanReceiptSub: 'Extrai valor, loja e itens com IA',
    aiBadge: 'IA',
    expenseAmountLabel: 'VALOR DA DESPESA',
    itemBoughtLabel: 'O QUE COMPROU (ITEM / PRODUTO)',
    itemBoughtPlaceholder: 'Ex: Café, Supermercado, Combustível...',
    storeLabel: 'ESTABELECIMENTO (ONDE GASTOU)',
    storePlaceholder: 'Ex: VIP Spar, Shoprite, Galp...',
    essentialCategory: 'Necessidades Fixas (50%)',
    lifestyleCategory: 'Estilo de Vida (30%)',
    savingsCategory: 'Poupança / Metas (20%)',
    categoryLabel: 'CATEGORIA DE ORÇAMENTO',
    saveExpenseBtn: 'Registar Despesa',
    updateExpenseBtn: 'Atualizar Despesa',
    errorExpenseAmount: 'Por favor, introduz um montante válido.',
    errorExpenseDesc: 'Por favor, introduz a descrição da despesa.',

    salaryModalTitle: 'Registar Salário do Mês',
    salaryNetLabel: 'VALOR LÍQUIDO A RECEBER',
    simulationTitle: 'SIMULAÇÃO 50 / 30 / 20',
    needs50Label: 'Necessidades (50%)',
    wants30Label: 'Desejos Pessoais (30%)',
    savings20Label: 'Poupanças / Metas (20%)',
    confirmDistributeSalary: 'Confirmar e Distribuir Salário',
    errorSalaryValid: 'Por favor, introduz um valor de salário válido e superior a zero.',

    scannerTitle: 'Digitalizador de Faturas',
    scannerSubtitle: 'Tira uma foto nítida do recibo ou fatura',
    takePhoto: 'Tirar Fotografia',
    chooseGallery: 'Escolher da Galeria',
    processingReceipt: 'A analisar recibo com IA...',
    storeExtracted: 'Loja Identificada',
    totalExtracted: 'Total Extraído',
    saveReceiptBtn: 'Gravar Despesa da Fatura',

    currencyConvertedTitle: 'Câmbio de Moeda Efetuado',
    currencyConvertedMsg: 'Todos os teus saldos, orçamentos, metas e transações foram convertidos à taxa de câmbio atual.',
    confirmExchangeTitle: 'Converter Valores para Nova Moeda?',
    confirmExchangeMsg: 'Desejas converter todos os valores existentes na tua carteira para a nova moeda com base na taxa de câmbio oficial?',

    notificationsTitle: 'Notificações & Bancos',
    tabMessages: 'Mensagens',
    tabSimulator: 'Simulador',
    emptyNotifications: 'Nenhuma notificação financeira registada.',
    simulateSmsBtn: 'Processar Notificação',
    reportsTitle: 'Relatórios & Gráficos',
    tabWeekly: 'Semanal',
    tabYearly: 'Anual',
    weeklyAverage: 'Média Semanal',
    highestExpense: 'Maior Despesa',

    // Month selector
    selectMonthTitle: 'Selecionar Mês',
    selectMonthSubtitle: 'Escolhe o mês para visualizar o histórico de despesas e orçamento',
    currentMonthBadge: 'Mês Atual',

    // Expense Chart
    expenseEvolution: 'Evolução de Gastos',
    weeklyEvolutionDesc: 'Consumo por semanas do mês',
    yearlyEvolutionDesc: 'Histórico dos 12 meses do ano',
    weeks: 'Semanas',
    yearly: 'Anual',
    totalInPeriod: 'Total no Período',
    averagePer: 'Média por',
    week: 'Semana',
    month: 'Mês',
    weekShort: 'Sem',

    // Receipt Scanner Modal extras
    receiptEmptySubtitle: 'Tira uma foto da tua fatura ou seleciona uma imagem da galeria para extrair automaticamente os dados com IA.',
    camera: 'Câmara',
    takePhotoNow: 'Tirar foto agora',
    gallery: 'Galeria',
    chooseImage: 'Escolher imagem',
    tipLighting: 'Certifica-te de que a fatura está bem iluminada e sem sombras.',
    tipFraming: 'Enquadra toda a fatura na foto, incluindo o total.',
    extractingAi: 'A extrair dados com IA...',
    fewSecondsWait: 'Isto pode demorar alguns segundos',
    dataExtractedSuccess: 'Dados extraídos com sucesso',
    storeEstablishment: 'Estabelecimento',
    storeNamePlaceholder: 'Nome da loja',
    totalAmount: 'Total',
    itemsDetected: 'itens detetados',
    suggestedCategory: 'Categoria sugerida',
    essential: 'Essencial',
    lifestyle: 'Estilo de vida',
    receiptSavedSuccess: 'Fatura Guardada com Sucesso!',
    confirmAndSave: 'Confirmar e guardar',
    restartBtn: 'Recomeçar',
    newPhotoBtn: 'Nova Foto',

    // SMS Notification Modal extras
    smsModalTitle: 'Leitor de SMS & Notificações',
    smsModalSubtitle: 'M-Pesa • e-Mola • Millennium BIM • Access Bank',
    autoSmsDetection: 'Leitura Automática de SMS & Notificações',
    autoSmsDesc: 'Ativa a leitura automática para registar automaticamente as tuas despesas e entradas de M-Pesa, e-Mola, Millennium BIM (+842424) e Access Bank.',
    enableAutoReadingBtn: 'Ativar Leitura Automática',
    pasteOrSimulate: 'COLAR OU SIMULAR MENSAGEM RECEBIDA',
    smsPlaceholder: 'Cola aqui a mensagem recebida de M-Pesa, e-Mola, BIM ou Access Bank...',
    mozambiqueSamples: 'EXEMPLOS DE MOÇAMBIQUE PARA TESTAR:',
    recipientOrStore: 'Estabelecimento / Destinatário:',
    rule503020: 'Regra 50/30/20:',
    saveThisExpense: 'Gravar Esta Despesa no Carterinha',
    transactionRecorded: 'Transação Registada!',

    // Notification Sources (Fontes de Notificações)
    tabSources: 'Fontes',
    sourcesTitle: 'Fontes de Notificações',
    sourcesDesc: 'Escolhe quais bancos e agentes móveis podem enviar notificações para o Carterinha. Outras apps (ex: WhatsApp) são automaticamente ignoradas.',
    defaultSourcesLabel: 'BANCOS & AGENTES MÓVEIS',
    customSourcesLabel: 'FONTES PERSONALIZADAS',
    addCustomSourceLabel: 'ADICIONAR FONTE',
    addSourcePlaceholder: 'Nome do remetente (ex: Moza Banco)',
    addSourceBtn: 'Adicionar',
    removeSource: 'Remover',
    sourceEnabledLabel: 'Ativa',
    sourceDisabledLabel: 'Inativa',
    sourceEmptyCustom: 'Sem fontes personalizadas. Adiciona bancos ou agentes não listados acima.',

    // Price Comparison Screen
    priceComparisonTitle: 'Comparador de Preços',
    priceComparisonSubtitle: 'Compara preços locais, monitoriza poupanças e encontra as melhores opções',
    tabPriceHistory: 'Histórico',
    tabPriceSimulator: 'Simulador',
    tabStores: 'Lojas',
    searchProductPlaceholder: 'Pesquisar produto ou loja...',
    popularItems: 'ITENS POPULARES',
    noPriceHistoryFound: 'Nenhum histórico de preço encontrado para este item.',
    bestPriceAt: 'Menor Preço',
    averagePriceLabel: 'Preço Médio',
    priceDifference: 'Diferença',
    saveWithBestOption: 'Poupança Estimada',
    simulatePurchase: 'Simular Compra',

    // AI Advisor Screen
    advisorTitle: 'Consultor Financeiro IA',
    advisorSubtitle: 'Orientação financeira inteligente em tempo real',
    advisorPlaceholder: 'Pergunta algo sobre as tuas finanças...',
    budgetAnalysisPrompt: 'Analisa o meu orçamento mensal e a divisão 50/30/20. Está equilibrado?',
    topSpendingPrompt: 'Qual foi a minha maior categoria de despesa recentemente?',
    whereToCutPrompt: 'Com base nos meus gastos recentes, onde posso cortar para poupar mais?',
    reviewGoalsPrompt: 'Como estão as minhas metas de poupança e como posso acelerá-las?',
    thinkingAi: 'O Consultor IA está a analisar os teus dados...',
    onlineMlStatus: 'IA Conectada',
    offlineAiStatus: 'Modo Offline',
    clearChatHistory: 'Limpar Conversa',
    placeholderExpenseName: 'Ex: Renda da casa, Credelec EDM...',
    placeholderExpenseAmount: 'Ex: 5000,00',
    placeholderExpenseDay: 'Ex: 5',
    placeholderSmsPaste: 'Cole aqui o texto de um SMS ou notificação recebida...',
    placeholderSearchItem: 'Pesquisar produto ou estabelecimento...',
    placeholderItemName: 'Ex: Arroz 5kg, Óleo 1L, Café...',
    placeholderStoreName: 'Ex: Shoprite, VIP Spar, Recheio...',
    placeholderAiAdvisor: 'Pergunta sobre gastos, 50/30/20, metas ou dicas...',
    placeholderCustomDeposit: 'Ex: 1500',
    placeholderFixedExpenseName: 'Nome (ex: Renda, Eletricidade, Internet)',
    placeholderFixedExpenseAmount: 'Valor mensal (MT)',
    placeholderFixedExpenseDay: 'Dia do mês (1 a 31)',
    placeholderDeleteGoalReason: 'Ex: Já comprei o telemóvel à vista com desconto...',
    placeholderAiKey: 'AIzaSy... ou AQ.Ab8RN...',
    biometricFingerprint: 'Impressão Digital',
    biometricFaceId: 'Face ID / Rosto',
    unlockPrompt: 'Desbloquear Carterinha',
    usePin: 'Usar PIN',
    resetAppTitle: 'Repor Aplicação Carterinha',
    resetAppDesc: 'Esqueceu o seu PIN de segurança? Esta operação irá apagar todos os dados guardados localmente e regressar ao ecrã inicial de boas-vindas.\n\nEsta ação é permanente e irreversível!',
    cancelReset: 'Cancelar',
    yesResetAll: 'Sim, Repor Tudo',
    welcomeUser: 'Bem-vindo',
    touchSensorOrPin: 'Toque no sensor biométrico ou use o PIN / Palavra-passe',
    authWithBiometrics: 'Autenticar com Impressão Digital',
    digitalLabel: 'Digital',
    eraseDigit: 'Apagar dígito',
    eraseLabel: 'Apagar',
    forgotPinLabel: 'Esqueceu o PIN / Senha?',
    resetDataAction: 'Repor dados',
    errIncompleteTitle: 'Dados Incompletos',
    errIncompleteDesc: 'Por favor, preencha o seu nome e e-mail.',
    errInvalidPinTitle: 'PIN Inválido',
    errInvalidPinDesc: 'O PIN de segurança deve ter exatamente 4 dígitos.',
    errPinMismatchTitle: 'PIN Incompatível',
    errPinMismatchDesc: 'Os 4 dígitos do PIN não coincidem.',
    errInvalidSalaryTitle: 'Salário Inválido',
    errInvalidSalaryDesc: 'Por favor, introduza um valor de rendimento mensal válido.',
    errSumPercentTitle: 'Soma das Percentagens',
    errSumPercentDesc: 'A soma das três categorias deve ser exatamente 100%.',
    onboardingBrandSubtitle: 'Configuração Inicial das Tuas Finanças Local-First',
    namePlaceholder: 'Ex: Leonardo Juliano',
    biometricsDesc: 'Desbloqueia a Carterinha com a tua Impressão Digital',
    baseCalculationIn: 'Base de cálculo em',
    needsHint: '50% (Renda, água)',
    wantsHint: '30% (Lazer, jantar)',
    savingsHint: '20% (Fundo, metas)',
    pinPlaceholder: '••••',
    amountPlaceholder: '0,00',

    // Settings & Profile additions
    settingsAndProfile: 'Definições & Perfil',
    editProfileSettings: 'Editar perfil e configurações financeiras',
    accountSection: 'Conta',
    preferencesSection: 'Preferências',
    securityMenuLabel: 'Segurança (PIN / Biometria)',
    budgetSplitMenuLabel: 'Orçamento',
    salaryCycleMenuLabel: 'Ciclo do Salário',
    salaryPayDayOn: 'Dia',
    monthly: 'Mensal',
    biweekly: 'Quinzenal',
    bimonthly: 'Bimestral',
    fixedExpensesAndCategories: 'Despesas Fixas & Categorias',
    aiAdvisorMenuLabel: 'Consultor de IA',
    smsBanksMenuLabel: 'Leitor de SMS & Bancos',
    priceComparisonMenuLabel: 'Comparador de Preços',
    appearanceMenuLabel: 'Aparência',
    aiGeminiMenuLabel: 'Inteligência Artificial (Google Gemini)',
    aiGeminiSubLabel: 'Modo Autónomo Direto no Telemóvel',
    lockAppNow: 'Bloquear Aplicação Agora',
    resetDatabaseBtn: 'Limpar / Repor Base de Dados (Zero Mockados)',
    resetDatabaseTitle: 'Repor Base de Dados',
    resetDatabaseDesc: 'Tem a certeza de que deseja apagar todas as despesas, metas e dados guardados? O aplicativo voltará ao estado inicial limpo para registar os seus dados reais.',
    yesClearAll: 'Sim, Limpar Tudo',
    dbResetSuccess: 'A base de dados foi limpa com sucesso. Configure os seus dados reais no assistente inicial.',
    editProfileModalTitle: 'Editar Perfil',
    fullNameLabel: 'NOME COMPLETO',
    salaryFrequencyLabel: 'FREQUÊNCIA / INTERVALO DO SALÁRIO',
    profileSaveSuccess: 'Perfil e configurações do ciclo salarial atualizados com sucesso!',
    budgetSplitModalTitle: 'Divisão Orçamental',
    budgetSplitModalSubtitle: 'Personalize a percentagem de cada categoria',
    needsPercentLabel: 'Fixas (%)',
    wantsPercentLabel: 'Lazer (%)',
    savingsPercentLabel: 'Metas (%)',
    apply: 'Aplicar',
    budgetUpdatedSuccess: 'Divisão orçamental atualizada com sucesso!',
    budgetSum100Alert: 'A soma das percentagens deve totalizar 100%.',
    appSecurityTitle: 'Segurança do Aplicativo',
    pin4DigitsLabel: 'PIN DE 4 DÍGITOS (Deixe vazio para desativar)',
    savePinBtn: 'Gravar PIN',
    pinConfigSuccess: 'PIN configurado com sucesso!',
    pinRemovedSuccess: 'PIN removido.',
    pinInvalidLength: 'O PIN de segurança deve ter exatamente 4 dígitos.',
    aiDirectModalTitle: 'IA Direta no Smartphone',
    aiDirectModalSubtitle: 'O aplicativo comunica diretamente com o Google Gemini.',
    activeModels: 'Modelos Ativos:',
    activeModelsDesc: 'gemini-3.6-flash (Visão/OCR de faturas, Consultor Financeiro & Avaliação de Gastos)',
    googleGeminiKeyLabel: 'CHAVE DA API GOOGLE GEMINI',
    testConnectionBtn: 'Testar Conexão',
    testingConnectionBtn: 'A Testar...',
    restoreDefaultBtn: 'Restaurar Padrão',
    saveKeyBtn: 'Gravar Chave',
    keySavedSuccess: 'A chave do Google Gemini foi guardada localmente com sucesso!',
    keyRestoredSuccess: 'A chave de IA predefinida da Carterinha foi reposta.',
    aiDirectSuccessTitle: 'IA Direta Operacional',
    aiDirectSuccessMsg: 'O telemóvel está a comunicar diretamente com o Google Gemini!',
    importDatabaseTitle: 'Importar Base de Dados',
    importCompleteTitle: 'Importação Concluída!',
    importDatabaseSubtitle: 'Seleciona o ficheiro JSON exportado anteriormente para restaurar todos os teus dados e configurações.',
    selectFileBtn: 'Selecionar ficheiro',
    restoringDatabaseMsg: 'A restaurar a base de dados SQLite...',
    redirectToSecurityPinMsg: 'Será redirecionado para o ecrã de segurança para introduzir o PIN.',
    continueToPinBtn: 'Continuar para o PIN',
    fileEmptyOrUnreadable: 'O ficheiro selecionado está vazio ou ilegível.',
    errorImportingFile: 'Erro ao carregar ficheiro',
    cannotExportData: 'Não foi possível exportar os dados.',

    // Goals screen & modals additions
    noActiveGoals: 'Sem Metas Ativas',
    noActiveGoalsSub: 'Cria o teu primeiro objetivo financeiro para poupares com disciplina!',
    completedBadge: 'Concluída',
    viewHistoryBtn: 'Ver Histórico',
    otherAmountBtn: 'Outro',
    goalCompletedBanner: 'Meta concluída a 100%! Objetivo financeiro atingido.',
    quickDepositNoGoal: 'Crie uma meta primeiro para realizar um depósito.',
    quickDepositExceeds: 'O depósito excede o montante necessário para concluir a meta.',
    quickDepositSaved: 'Poupança Registada',
    quickDepositSuccessMsg: 'Adicionaste fundos à meta com sucesso.',
    accumulatedProgress: 'Progresso Acumulado',
    goalAchievedBadge: 'Meta Atingida!',
    completedPercentSuffix: 'Concluído',
    totalTargetLabel: 'Alvo Total',
    remainingLabel: 'Falta',
    createdAtLabel: 'Criada em:',
    targetDeadlineLabel: 'Prazo Alvo:',
    noDeadlineLabel: 'Sem prazo',
    initialAccumulatedBalance: 'Saldo Inicial Acumulado',
    savedAtOpeningDesc: 'guardados no momento de abertura.',
    noDepositsAssociatedDesc: 'Ainda não foram associados depósitos específicos a esta meta.',
    depositForGoalDesc: 'Aporte para meta',
    consultWithAiBtn: 'Consultar IA Sobre Esta Meta',
    reasonGoalAchieved: 'Meta já foi alcançada / concluída',
    reasonPriorityChange: 'Mudança de prioridades financeiras',
    reasonEmergency: 'Preciso do dinheiro para uma emergência',
    reasonMistake: 'Criada por engano ou para teste',
    reasonOther: 'Outro motivo (especificar abaixo)',
    accumulatedBalanceWarning: 'Saldo acumulado:',
    accumulatedBalanceWarningDesc: 'Esta meta já possui poupanças acumuladas. O histórico de transações será preservado nos seus relatórios.',
    confirmDeleteGoalDesc: 'Tem a certeza que deseja apagar a meta?',
    deleteReasonPlaceholder: 'Descreva o motivo (opcional)...',
    confirmDeleteGoalBtn: 'Eliminar Meta',
    goalDeletedSuccess: 'Meta Eliminada',
    goal100Completed: 'Meta 100% Concluída! Já acumulou o montante total.',
    accumulatedAmountLabel: 'Acumulado:',
    ofTargetLabel: 'de',
    availableAccountBalance: 'Saldo em conta disponível:',
    errDepositValidAmount: 'Por favor, informe um valor válido maior que zero.',
    errGoalAlreadyCompleted: 'Esta meta já atingiu 100% do seu objetivo estipulado.',
    errDepositExceedsRemaining: 'O valor informado excede o que falta para concluir a meta.',
    confirmDepositBtn: 'Confirmar Depósito',
    goalAlreadyDoneBtn: 'Meta Concluída',
    errorProcessingGoal: 'Erro ao processar a meta.',

    // Fixed Expenses screen & component additions
    noFixedExpenses: 'Sem Contas Fixas',
    noFixedExpensesSub: 'Adiciona as tuas despesas mensais previsíveis como renda, água ou internet para gerir os 50% essenciais.',
    newFixedExpenseBtn: 'Nova Conta Fixa',
    paidBadge: 'Paga ✓',
    dueOnDay: 'Vence dia',
    saveAccountBtn: 'Gravar Conta',
    accountAlreadyExists: 'Conta já existe',
    accountAlreadyExistsDesc: 'Já tens uma despesa fixa com o mesmo nome. Escolhe outro nome ou edita a existente.',
    confirmFixedPayDesc: 'Pretende liquidar esta despesa fixa com débito direto no saldo dos 50% de Despesas Fixas?',
    fixedPaidSuccess: 'A despesa foi liquidada com sucesso nas tuas Despesas Fixas (50%).',
    deleteFixedConfirm: 'Tens a certeza de que desejas remover esta conta da tua lista de contas fixas?',
    dueDayFieldLabel: 'DIA DE VENCIMENTO',
    fixedExpensesEssential: 'Despesas Fixas (50% Essenciais)',
    predictableMonthlyCommitments: 'Compromissos mensais previsíveis',
    newShort: 'Nova',
    dueDayBadge: 'Dia',
    fixedExpensesCommittedDesc: 'do orçamento essencial de 50% já está comprometido.',
    addFixedExpenseSub: 'Registe custos essenciais mensais',
    dueDebitDayLabel: 'DIA DE DÉBITO NO MÊS',
    saveFixedExpenseBtn: 'Gravar Despesa Fixa',

    // Appearance additions
    selectLanguageTitle: 'Selecionar Idioma',
    selectCurrencyTitle: 'Selecionar Moeda',

    // Transaction Modal Fixed Validation
    fixedValidationTitle: 'Validação de Despesas Fixas',
    fixedValidationSub: 'O saldo de 50% Fixas é reservado para as contas que definiste. O que pretendes fazer?',
    changeToLifestyleRecommended: 'Mudar para Lazer (30%) — Recomendado',
    addToRecurringFixed: 'Adicionar às Contas Fixas Recorrentes',
    keepAsOneTimeFixed: 'Manter como Fixa Pontual',

    // Lock & Security & Onboarding additions
    stepOf: 'DE',
    encryptedVault: 'Cofre Criptografado',
    localFirstBadge: 'Local-First',
    loadingCarterinha: 'A carregar Carterinha Local-First...',
    spendingPerWeek: 'Gastos por semana',
    share: 'Partilhar',
    monthlyOverview: 'Visão geral do mês',
    salaryModalSubDefault: 'Defina o rendimento líquido para calcular a regra 50/30/20',
    salaryModalSubMonth: 'Atualize ou confirme o salário para o ciclo deste mês',
    incomeForMonth: 'Rendimento de',
    errorRegisterSalary: 'Erro ao registar o salário.',
    reportShareHeader: '[Relatório Financeiro - Carterinha]',
    reportShareMonth: 'Mês',
    reportShareTotalSpent: 'Total Gasto',
    reportShareEssentials: 'Essenciais / Fixas',
    reportShareLifestyle: 'Lazer / Estilo de Vida',
    reportShareFooter: 'Gerado pela aplicação Carterinha Local-First.',

    // Fixed Expenses Categories & Actions
    catHousing: 'Habitação',
    catUtilities: 'Serviços & Contas',
    catTelecom: 'Telecom & Internet',
    catHealth: 'Saúde',
    catOther: 'Outros',
    selectCategory: 'Selecionar Categoria',
    errorTitle: 'Erro',
    errorPayFixedExpense: 'Não foi possível registar o pagamento da despesa fixa.',

    // Budget Cards Allocation
    essentialNeedsSub: 'Habitação, Contas, Alimentação, Saúde',
    lifestyleWantsSub: 'Restauração, Compras, Entretenimento',
    savingsGoalsSub: 'Fundo Emergência, Viagens, Investimentos',
    noSalaryRegisteredThisMonth: 'Nenhum salário registado para este mês',
    registerIncomeFor503020: 'Registe o seu rendimento mensal para aplicar a divisão automática 50/30/20.',
    monthlyAllocationHeader: 'Divisão Orçamental 50/30/20',
    spentLabel: 'Gasto',
    availableLabel: 'Disponível',
    monthlyCeilingLabel: 'Teto Mensal',
  },
  en: {
    navDashboard: 'Home',
    navGoals: 'Goals',
    navFixedExpenses: 'Fixed Expenses',
    navTransactions: 'Transactions',
    navSettings: 'Settings',
    navNotifications: 'Notifications',
    navAiAdvisor: 'AI Advisor',
    more: 'More',

    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    done: 'Done',
    loading: 'Loading...',
    add: 'Add',
    close: 'Close',
    continue: 'Continue',
    selectFile: 'Select File',
    quickActions: 'Quick Actions',
    newExpense: 'Add Expense',
    scanReceipt: 'Scan Receipt',
    priceComparison: 'Price Compare',
    smsBanks: 'Bank SMS',

    availableBalance: 'Available Balance',
    ofTotalFunds: 'of',
    totalSpentThisMonth: 'Total Spent This Month',
    activeFixedExpenses: 'Active Recurring',
    estimatedFreeBalance: 'Estimated Free Balance',
    monthlyAllocation503020: '50/30/20 Budget Breakdown',
    essentialNeeds: 'Needs (50%)',
    lifestyleWants: 'Wants (30%)',
    savingsGoals: 'Savings (20%)',
    allocated: 'Allocated',
    spent: 'Spent',
    freeLimit: 'Available',
    spentOverLimit: 'Over Budget',
    recentTransactions: 'Recent Transactions',
    seeAll: 'See All',
    noTransactionsYet: 'No transactions recorded this month.',
    offlineMode: 'No Internet connection — offline mode',
    aiOfflineLocalData: 'AI Advisor offline — changes saved locally',
    newMonthCycle: 'New Monthly Cycle',
    setSalaryForMonth: 'Add this month\'s income to calculate your 50/30/20 budget.',
    setSalaryBtn: 'Set Income',
    quickAddIncome: 'Add Income',

    transactionsTitle: 'Transactions',
    searchTransactions: 'Search transactions...',
    filterAll: 'All',
    filterEssential: 'Needs (50%)',
    filterLifestyle: 'Wants (30%)',
    filterSavings: 'Savings (20%)',
    totalTransactions: 'Total Transactions',
    noFilteredTransactions: 'No transactions found.',
    deleteTransactionConfirm: 'Are you sure you want to delete this transaction?',

    settingsTitle: 'Settings',
    userProfile: 'User Profile',
    budgetSplit: '50/30/20 Budget Split',
    securityAndPin: 'Security & PIN',
    appearanceAndLang: 'Appearance & Language',
    geminiAiKey: 'Gemini AI API Key',
    importData: 'Import Data',
    exportData: 'Export Data',
    lockNow: 'Lock App Now',
    resetDatabase: 'Reset All Data',
    resetDbConfirm: 'Are you sure you want to delete all local records?',
    resetDbWarning: 'This action is permanent and cannot be undone.',
    salaryMonthlyBase: 'MONTHLY BASE SALARY',
    initialWalletBalance: 'STARTING WALLET BALANCE',
    salaryDayHabitual: 'PAYDAY (1-31)',
    salaryFrequency: 'PAY FREQUENCY',

    importTitle: 'Import Data',
    importSubtitle: 'Select a previously exported JSON backup file to restore your wallet data.',
    importLoading: 'Restoring database...',
    importSuccess: 'Database restored successfully. Enter your PIN to continue.',
    importError: 'Failed to restore database.',
    importInvalidFile: 'The selected file is not a valid Carterinha backup.',
    exportSuccess: 'Data exported successfully!',

    appearanceTitle: 'Appearance & Language',
    themeSelection: 'Theme',
    darkTheme: 'Galaxy Dark',
    lightTheme: 'Crystal Light',
    languageSelection: 'Language',
    currencySelection: 'Primary Currency',
    primaryColorSelection: 'Accent Color',
    realTimeExchange: 'Real-Time Exchange Rates',
    exchangeUpdated: 'Last updated',

    goalsTitle: 'Financial Goals',
    newGoal: 'New Goal',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    deadlineOptional: 'Target Deadline (Optional)',
    selectDate: 'Select Date',
    completedGoals: 'Completed',
    activeGoals: 'In Progress',
    depositInGoal: 'Add Deposit',
    remainingAmount: 'Remaining',
    goalCompleted: 'Goal Achieved!',

    fixedExpensesTitle: 'Fixed Expenses (50%)',
    addFixedExpense: 'Add Fixed Expense',
    expenseName: 'Expense Name',
    expenseAmount: 'Monthly Amount',
    dueDay: 'Due Day',
    expenseCategory: 'Category',
    duplicateExpenseWarning: 'A fixed expense with this name already exists.',
    committedTotal: 'Committed Fixed Total',
    availableForVariables: 'Free for Variable Spending',
    recurringAccounts: 'Recurring Bills',
    payExpense: 'Pay Bill',
    confirmPayment: 'Confirm Payment',

    lockTitle: 'Security & Password (Encrypted Vault)',
    enterPin: 'Enter your 4-digit PIN / Password',
    unlockWithBiometrics: 'Unlock with Biometrics',
    invalidPin: 'Incorrect PIN. Please try again.',

    onboardingStep: 'STEP',
    onboardingPreferences: 'Preferences',
    onboardingPreferencesDesc: 'Choose your preferred language and currency to personalize your experience.',
    onboardingPersonal: 'Personal Info',
    onboardingPersonalDesc: 'How should we call you in the app?',
    onboardingSecurity: 'Security & Password',
    onboardingSecurityDesc: 'Protect your financial records with a secure 4-digit PIN or password.',
    onboardingIncome: 'Income & Salary',
    onboardingIncomeDesc: 'Enter your net monthly income to calibrate the 50/30/20 rule.',
    onboardingBudget: 'Budget Split',
    onboardingBudgetDesc: 'Customize how your income is distributed across categories.',
    finishSetup: 'Get Started',
    nextStep: 'Continue',
    selectLanguageDropdown: 'Select Language',
    selectCurrencyDropdown: 'Select Base Currency',
    fullName: 'FULL NAME',
    emailAddress: 'EMAIL ADDRESS',
    create4DigitPin: 'CREATE PIN / PASSWORD (4 DIGITS)',
    confirmPin: 'CONFIRM PIN / PASSWORD',
    enableBiometrics: 'Enable Biometric Unlock',
    monthlyNetSalary: 'NET MONTHLY INCOME',
    initialBalanceOptional: 'STARTING BALANCE (OPTIONAL)',

    modalTitleGoalNew: 'New Savings Goal',
    modalTitleGoalEdit: 'Edit Savings Goal',
    modalSubGoal: 'Set a target for your savings or investments',
    goalNameLabel: 'GOAL NAME',
    goalNamePlaceholder: 'E.g., Emergency Fund, Car, Travel',
    targetAmountLabel: 'TOTAL TARGET AMOUNT',
    targetAmountPlaceholder: 'E.g., 50,000.00',
    deadlineLabel: 'TARGET DEADLINE (OPTIONAL)',
    deadlineSelectCalendar: 'Select Date',
    createGoalBtn: 'Create Goal',
    saveChangesBtn: 'Save Changes',
    errorGoalName: 'Please enter a goal name.',
    errorGoalTarget: 'Please enter a valid target amount.',

    depositTitle: 'Deposit to Goal',
    depositSub: 'Allocate savings toward your financial target',
    depositAmountLabel: 'DEPOSIT AMOUNT',
    depositNoteLabel: 'NOTE (OPTIONAL)',
    depositNotePlaceholder: 'E.g., Bonus, freelance payout',
    depositQuickAdd: 'Quick Add',
    depositConfirmBtn: 'Confirm Deposit',
    depositSuccess: 'Deposit recorded successfully!',
    depositErrorBalance: 'Insufficient available balance in your wallet.',
    depositErrorExceed: 'Amount exceeds the remaining target for this goal.',

    deleteGoalTitle: 'Delete Goal',
    deleteGoalDesc: 'Are you sure you want to delete this goal?',
    refundWarning: 'Any funds accumulated in this goal will be returned to your available balance.',
    refundToBalance: 'Return saved funds to available balance',
    confirmDeleteBtn: 'Delete Goal',

    goalHistoryTitle: 'Deposit History',
    totalSaved: 'Total Saved',
    depositsCount: 'Deposits Made',
    noDepositsYet: 'No deposits recorded for this goal yet.',

    newExpenseTitle: 'New Expense',
    editExpenseTitle: 'Edit Expense',
    scanReceiptTitle: 'Scan Receipt',
    scanReceiptSub: 'Extract total, merchant, and items with AI',
    aiBadge: 'AI',
    expenseAmountLabel: 'EXPENSE AMOUNT',
    itemBoughtLabel: 'ITEM OR PRODUCT',
    itemBoughtPlaceholder: 'E.g., Groceries, Coffee, Fuel...',
    storeLabel: 'MERCHANT / STORE',
    storePlaceholder: 'E.g., Supermarket, Gas Station...',
    essentialCategory: 'Needs (50%)',
    lifestyleCategory: 'Wants (30%)',
    savingsCategory: 'Savings (20%)',
    categoryLabel: 'BUDGET CATEGORY',
    saveExpenseBtn: 'Save Expense',
    updateExpenseBtn: 'Update Expense',
    errorExpenseAmount: 'Please enter a valid amount.',
    errorExpenseDesc: 'Please enter a description for the expense.',

    salaryModalTitle: 'Record Monthly Income',
    salaryNetLabel: 'NET MONTHLY AMOUNT',
    simulationTitle: '50 / 30 / 20 BREAKDOWN',
    needs50Label: 'Needs (50%)',
    wants30Label: 'Wants (30%)',
    savings20Label: 'Savings (20%)',
    confirmDistributeSalary: 'Distribute Income',
    errorSalaryValid: 'Please enter a valid income amount greater than zero.',

    scannerTitle: 'Scan Receipt',
    scannerSubtitle: 'Take a clear photo of your receipt or invoice',
    takePhoto: 'Take Photo',
    chooseGallery: 'Choose Photo',
    processingReceipt: 'Analyzing receipt with AI...',
    storeExtracted: 'Merchant Identified',
    totalExtracted: 'Total Extracted',
    saveReceiptBtn: 'Save Receipt',

    currencyConvertedTitle: 'Currency Converted',
    currencyConvertedMsg: 'All balances, budgets, goals, and transactions were converted using current exchange rates.',
    confirmExchangeTitle: 'Convert to New Currency?',
    confirmExchangeMsg: 'Would you like to recalculate all your existing wallet amounts based on live exchange rates?',

    notificationsTitle: 'Notifications & Banks',
    tabMessages: 'Messages',
    tabSimulator: 'Simulator',
    emptyNotifications: 'No notifications recorded yet.',
    simulateSmsBtn: 'Process Notification',
    reportsTitle: 'Reports & Analytics',
    tabWeekly: 'Weekly',
    tabYearly: 'Yearly',
    weeklyAverage: 'Weekly Average',
    highestExpense: 'Highest Expense',

    // Month selector
    selectMonthTitle: 'Select Month',
    selectMonthSubtitle: 'Choose a month to view historical spending and budgets',
    currentMonthBadge: 'Current',

    // Expense Chart
    expenseEvolution: 'Spending Trends',
    weeklyEvolutionDesc: 'Weekly spending across the current month',
    yearlyEvolutionDesc: '12-month annual spending overview',
    weeks: 'Weeks',
    yearly: 'Yearly',
    totalInPeriod: 'Period Total',
    averagePer: 'Average per',
    week: 'Week',
    month: 'Month',
    weekShort: 'Wk',

    // Receipt Scanner Modal extras
    receiptEmptySubtitle: 'Take a photo of your receipt or select an image to extract details automatically with AI.',
    camera: 'Camera',
    takePhotoNow: 'Take Photo',
    gallery: 'Photos',
    chooseImage: 'Choose Photo',
    tipLighting: 'Ensure the receipt is well lit without harsh shadows.',
    tipFraming: 'Fit the entire receipt within the frame, including total and date.',
    extractingAi: 'Extracting data with AI...',
    fewSecondsWait: 'This usually takes a few seconds',
    dataExtractedSuccess: 'Data extracted successfully',
    storeEstablishment: 'Merchant',
    storeNamePlaceholder: 'Store name',
    totalAmount: 'Total',
    itemsDetected: 'items detected',
    suggestedCategory: 'Suggested Category',
    essential: 'Needs (50%)',
    lifestyle: 'Wants (30%)',
    receiptSavedSuccess: 'Receipt Saved!',
    confirmAndSave: 'Confirm & Save',
    restartBtn: 'Retake',
    newPhotoBtn: 'New Photo',

    // SMS Notification Modal extras
    smsModalTitle: 'Bank SMS & Notifications',
    smsModalSubtitle: 'M-Pesa • e-Mola • Millennium BIM • Access Bank',
    autoSmsDetection: 'Automatic SMS & Notification Reading',
    autoSmsDesc: 'Enable automatic reading to automatically track expenses and income from M-Pesa, e-Mola, Millennium BIM (+842424), and Access Bank.',
    enableAutoReadingBtn: 'Enable Automatic Reading',
    pasteOrSimulate: 'PASTE OR SIMULATE SMS ALERT',
    smsPlaceholder: 'Paste a notification SMS from M-Pesa, e-Mola, BIM, or Access Bank...',
    mozambiqueSamples: 'TRY SAMPLE MESSAGES:',
    recipientOrStore: 'Merchant / Recipient:',
    rule503020: '50/30/20 Rule:',
    saveThisExpense: 'Save Expense',
    transactionRecorded: 'Expense Saved!',

    // Notification Sources
    tabSources: 'Sources',
    sourcesTitle: 'Notification Sources',
    sourcesDesc: 'Choose which banks and mobile agents can send notifications to Carterinha. Other apps (e.g. WhatsApp) are automatically ignored.',
    defaultSourcesLabel: 'BANKS & MOBILE AGENTS',
    customSourcesLabel: 'CUSTOM SOURCES',
    addCustomSourceLabel: 'ADD SOURCE',
    addSourcePlaceholder: 'Sender name (e.g. Moza Bank)',
    addSourceBtn: 'Add',
    removeSource: 'Remove',
    sourceEnabledLabel: 'Active',
    sourceDisabledLabel: 'Inactive',
    sourceEmptyCustom: 'No custom sources. Add banks or agents not listed above.',

    // Price Comparison Screen
    priceComparisonTitle: 'Price Comparison',
    priceComparisonSubtitle: 'Compare local prices, track savings, and find the best deals',
    tabPriceHistory: 'Price History',
    tabPriceSimulator: 'Simulator',
    tabStores: 'Stores',
    searchProductPlaceholder: 'Search item or store...',
    popularItems: 'POPULAR ITEMS',
    noPriceHistoryFound: 'No price records found for this item.',
    bestPriceAt: 'Lowest Price',
    averagePriceLabel: 'Average Price',
    priceDifference: 'Difference',
    saveWithBestOption: 'Potential Savings',
    simulatePurchase: 'Simulate Purchase',

    // AI Advisor Screen
    advisorTitle: 'AI Financial Advisor',
    advisorSubtitle: 'Real-time financial guidance powered by AI',
    advisorPlaceholder: 'Ask anything about your finances...',
    budgetAnalysisPrompt: 'Review my monthly budget and 50/30/20 allocation. Is it balanced?',
    topSpendingPrompt: 'What is my highest spending category this month?',
    whereToCutPrompt: 'Based on my recent spending, where can I cut costs to save more?',
    reviewGoalsPrompt: 'How are my savings goals tracking and how can I reach them faster?',
    thinkingAi: 'AI is analyzing your finances...',
    onlineMlStatus: 'AI Connected',
    offlineAiStatus: 'Offline Mode',
    clearChatHistory: 'Clear Chat History',
    placeholderExpenseName: 'e.g., Rent, Electric Bill...',
    placeholderExpenseAmount: 'e.g., 5000.00',
    placeholderExpenseDay: 'e.g., 5',
    placeholderSmsPaste: 'Paste bank SMS or notification text here...',
    placeholderSearchItem: 'Search product or store...',
    placeholderItemName: 'e.g., Rice 5kg, Oil 1L, Coffee...',
    placeholderStoreName: 'e.g., Target, Walmart, Trader Joe\'s...',
    placeholderAiAdvisor: 'Ask about spending, 50/30/20 rule, goals or tips...',
    placeholderCustomDeposit: 'e.g., 1500',
    placeholderFixedExpenseName: 'Name (e.g., Rent, Electric, Internet)',
    placeholderFixedExpenseAmount: 'Monthly amount',
    placeholderFixedExpenseDay: 'Day of month (1-31)',
    placeholderDeleteGoalReason: 'e.g., Bought the phone in cash with a discount...',
    placeholderAiKey: 'AIzaSy... or AQ.Ab8RN...',
    biometricFingerprint: 'Fingerprint',
    biometricFaceId: 'Face ID',
    unlockPrompt: 'Unlock Carterinha',
    usePin: 'Use PIN',
    resetAppTitle: 'Reset Carterinha App',
    resetAppDesc: 'Forgot your security PIN? This operation will delete all locally stored data and return you to the welcome screen.\n\nThis action is permanent and cannot be undone!',
    cancelReset: 'Cancel',
    yesResetAll: 'Yes, Reset All',
    welcomeUser: 'Welcome',
    touchSensorOrPin: 'Touch fingerprint sensor or enter PIN / Password',
    authWithBiometrics: 'Authenticate with Biometrics',
    digitalLabel: 'Touch ID',
    eraseDigit: 'Delete digit',
    eraseLabel: 'Delete',
    forgotPinLabel: 'Forgot PIN / Password?',
    resetDataAction: 'Reset data',
    errIncompleteTitle: 'Incomplete Details',
    errIncompleteDesc: 'Please enter your name and email address.',
    errInvalidPinTitle: 'Invalid PIN',
    errInvalidPinDesc: 'The security PIN must be exactly 4 digits.',
    errPinMismatchTitle: 'PIN Mismatch',
    errPinMismatchDesc: 'The 4 digits do not match.',
    errInvalidSalaryTitle: 'Invalid Salary',
    errInvalidSalaryDesc: 'Please enter a valid monthly income amount.',
    errSumPercentTitle: 'Sum of Percentages',
    errSumPercentDesc: 'The sum of all three categories must equal exactly 100%.',
    onboardingBrandSubtitle: 'Local-First Personal Finance Setup',
    namePlaceholder: 'e.g., Leonardo Juliano',
    biometricsDesc: 'Unlock Carterinha with Fingerprint or Face ID',
    baseCalculationIn: 'Base calculation in',
    needsHint: '50% (Rent, water)',
    wantsHint: '30% (Leisure, dining)',
    savingsHint: '20% (Emergency, goals)',
    pinPlaceholder: '••••',
    amountPlaceholder: '0.00',

    // Settings & Profile additions
    settingsAndProfile: 'Settings & Profile',
    editProfileSettings: 'Edit profile & financial settings',
    accountSection: 'Account',
    preferencesSection: 'Preferences',
    securityMenuLabel: 'Security (PIN / Biometrics)',
    budgetSplitMenuLabel: 'Budget Split',
    salaryCycleMenuLabel: 'Salary Cycle',
    salaryPayDayOn: 'Day',
    monthly: 'Monthly',
    biweekly: 'Bi-weekly',
    bimonthly: 'Bi-monthly',
    fixedExpensesAndCategories: 'Fixed Expenses & Categories',
    aiAdvisorMenuLabel: 'AI Financial Advisor',
    smsBanksMenuLabel: 'SMS & Bank Reader',
    priceComparisonMenuLabel: 'Price Comparison',
    appearanceMenuLabel: 'Appearance',
    aiGeminiMenuLabel: 'Artificial Intelligence (Google Gemini)',
    aiGeminiSubLabel: 'Standalone Direct Mobile Mode',
    lockAppNow: 'Lock App Now',
    resetDatabaseBtn: 'Clear / Reset Database (Zero Mocks)',
    resetDatabaseTitle: 'Reset Database',
    resetDatabaseDesc: 'Are you sure you want to erase all expenses, goals, and saved records? The app will return to a clean initial state for your actual data.',
    yesClearAll: 'Yes, Erase Everything',
    dbResetSuccess: 'Database successfully cleared. Set up your actual financial profile in the wizard.',
    editProfileModalTitle: 'Edit Profile',
    fullNameLabel: 'FULL NAME',
    salaryFrequencyLabel: 'SALARY FREQUENCY / INTERVAL',
    profileSaveSuccess: 'Profile and salary cycle settings updated successfully!',
    budgetSplitModalTitle: 'Budget Allocation',
    budgetSplitModalSubtitle: 'Customize the percentage for each category',
    needsPercentLabel: 'Needs (%)',
    wantsPercentLabel: 'Wants (%)',
    savingsPercentLabel: 'Savings (%)',
    apply: 'Apply',
    budgetUpdatedSuccess: 'Budget allocation updated successfully!',
    budgetSum100Alert: 'The sum of all percentages must equal exactly 100%.',
    appSecurityTitle: 'App Security',
    pin4DigitsLabel: '4-DIGIT PIN (Leave empty to disable)',
    savePinBtn: 'Save PIN',
    pinConfigSuccess: 'PIN successfully configured!',
    pinRemovedSuccess: 'PIN removed.',
    pinInvalidLength: 'Security PIN must be exactly 4 digits.',
    aiDirectModalTitle: 'Direct AI on Mobile',
    aiDirectModalSubtitle: 'The app communicates directly with Google Gemini. No computer server or Python backend needed.',
    activeModels: 'Active Models:',
    activeModelsDesc: 'gemini-3.6-flash (Receipt OCR Vision, Financial Advisor & Spending Evaluation)',
    googleGeminiKeyLabel: 'GOOGLE GEMINI API KEY',
    testConnectionBtn: 'Test Connection',
    testingConnectionBtn: 'Testing...',
    restoreDefaultBtn: 'Restore Default',
    saveKeyBtn: 'Save Key',
    keySavedSuccess: 'Google Gemini key saved locally!',
    keyRestoredSuccess: 'Default Carterinha AI key restored.',
    aiDirectSuccessTitle: 'Direct AI Operational',
    aiDirectSuccessMsg: 'Your phone is communicating directly with Google Gemini!',
    importDatabaseTitle: 'Import Database',
    importCompleteTitle: 'Import Complete!',
    importDatabaseSubtitle: 'Select your previously exported JSON file to restore all your records and settings.',
    selectFileBtn: 'Select File',
    restoringDatabaseMsg: 'Restoring SQLite database...',
    redirectToSecurityPinMsg: 'You will be redirected to the security screen to enter your PIN.',
    continueToPinBtn: 'Continue to PIN',
    fileEmptyOrUnreadable: 'Selected file is empty or unreadable.',
    errorImportingFile: 'Error Loading File',
    cannotExportData: 'Unable to export data.',

    // Goals screen & modals additions
    noActiveGoals: 'No Active Goals',
    noActiveGoalsSub: 'Create your first financial goal to save with discipline!',
    completedBadge: 'Completed',
    viewHistoryBtn: 'View History',
    otherAmountBtn: 'Custom',
    goalCompletedBanner: 'Goal 100% completed! Financial target reached.',
    quickDepositNoGoal: 'Create a goal first before making a deposit.',
    quickDepositExceeds: 'Deposit exceeds the remaining amount needed to complete the goal.',
    quickDepositSaved: 'Savings Recorded',
    quickDepositSuccessMsg: 'Funds added to goal successfully.',
    accumulatedProgress: 'Accumulated Progress',
    goalAchievedBadge: 'Goal Achieved!',
    completedPercentSuffix: 'Completed',
    totalTargetLabel: 'Total Target',
    remainingLabel: 'Remaining',
    createdAtLabel: 'Created on:',
    targetDeadlineLabel: 'Target Deadline:',
    noDeadlineLabel: 'No deadline',
    initialAccumulatedBalance: 'Initial Saved Balance',
    savedAtOpeningDesc: 'saved upon creation.',
    noDepositsAssociatedDesc: 'No specific deposits have been logged for this goal yet.',
    depositForGoalDesc: 'Goal deposit',
    consultWithAiBtn: 'Ask AI About This Goal',
    reasonGoalAchieved: 'Goal achieved / completed',
    reasonPriorityChange: 'Shift in financial priorities',
    reasonEmergency: 'Funds needed for an emergency',
    reasonMistake: 'Created by mistake or testing',
    reasonOther: 'Other reason (specify below)',
    accumulatedBalanceWarning: 'Accumulated balance:',
    accumulatedBalanceWarningDesc: 'This goal already has saved funds. Transaction history will remain preserved in your reports.',
    confirmDeleteGoalDesc: 'Are you sure you want to delete this goal?',
    deleteReasonPlaceholder: 'Describe the reason (optional)...',
    confirmDeleteGoalBtn: 'Delete Goal',
    goalDeletedSuccess: 'Goal Deleted',
    goal100Completed: 'Goal 100% Completed! You have reached your target amount.',
    accumulatedAmountLabel: 'Saved:',
    ofTargetLabel: 'of',
    availableAccountBalance: 'Available account balance:',
    errDepositValidAmount: 'Please enter a valid amount greater than zero.',
    errGoalAlreadyCompleted: 'This goal has already reached 100% of its target.',
    errDepositExceedsRemaining: 'The entered amount exceeds what is needed to reach the goal.',
    confirmDepositBtn: 'Confirm Deposit',
    goalAlreadyDoneBtn: 'Goal Completed',
    errorProcessingGoal: 'Error processing goal.',

    // Fixed Expenses screen & component additions
    noFixedExpenses: 'No Fixed Expenses',
    noFixedExpensesSub: 'Add your predictable monthly expenses (rent, utilities, subscriptions) to manage your 50% essentials.',
    newFixedExpenseBtn: 'New Fixed Expense',
    paidBadge: 'Paid ✓',
    dueOnDay: 'Due day',
    saveAccountBtn: 'Save Expense',
    accountAlreadyExists: 'Expense already exists',
    accountAlreadyExistsDesc: 'A fixed expense with this name already exists. Choose another name or edit the existing one.',
    confirmFixedPayDesc: 'Settle this fixed expense with a direct deduction from your 50% Essentials balance?',
    fixedPaidSuccess: 'Expense successfully settled under your 50% Essentials.',
    deleteFixedConfirm: 'Are you sure you want to remove this expense from your recurring list?',
    dueDayFieldLabel: 'DUE DATE (DAY OF MONTH)',
    fixedExpensesEssential: 'Fixed Expenses (50% Essentials)',
    predictableMonthlyCommitments: 'Predictable monthly commitments',
    newShort: 'New',
    dueDayBadge: 'Day',
    fixedExpensesCommittedDesc: 'of the 50% essential budget is committed.',
    addFixedExpenseSub: 'Log essential monthly costs',
    dueDebitDayLabel: 'DEBIT DAY OF MONTH',
    saveFixedExpenseBtn: 'Save Fixed Expense',

    // Appearance additions
    selectLanguageTitle: 'Select Language',
    selectCurrencyTitle: 'Select Currency',

    // Transaction Modal Fixed Validation
    fixedValidationTitle: 'Fixed Expense Validation',
    fixedValidationSub: 'The 50% fixed budget is reserved for your registered bills. What would you like to do?',
    changeToLifestyleRecommended: 'Switch to Wants (30%) — Recommended',
    addToRecurringFixed: 'Add to Recurring Fixed Expenses',
    keepAsOneTimeFixed: 'Keep as One-Time Essential',

    // Lock & Security & Onboarding additions
    stepOf: 'OF',
    encryptedVault: 'Encrypted Vault',
    localFirstBadge: 'Local-First',
    loadingCarterinha: 'Loading Carterinha Local-First...',
    spendingPerWeek: 'Spending per week',
    share: 'Share',
    monthlyOverview: 'Monthly Overview',
    salaryModalSubDefault: 'Set net income to compute the 50/30/20 rule',
    salaryModalSubMonth: 'Update or confirm the salary for this month\'s cycle',
    incomeForMonth: 'Income for',
    errorRegisterSalary: 'Error registering salary.',
    reportShareHeader: '[Financial Report - Carterinha]',
    reportShareMonth: 'Month',
    reportShareTotalSpent: 'Total Spent',
    reportShareEssentials: 'Essentials / Fixed',
    reportShareLifestyle: 'Wants / Lifestyle',
    reportShareFooter: 'Generated by Carterinha Local-First app.',

    // Fixed Expenses Categories & Actions
    catHousing: 'Housing',
    catUtilities: 'Utilities & Bills',
    catTelecom: 'Telecom & Internet',
    catHealth: 'Health',
    catOther: 'Other',
    selectCategory: 'Select Category',
    errorTitle: 'Error',
    errorPayFixedExpense: 'Could not process fixed expense payment.',

    // Budget Cards Allocation
    essentialNeedsSub: 'Housing, Bills, Groceries, Health',
    lifestyleWantsSub: 'Dining, Shopping, Entertainment',
    savingsGoalsSub: 'Emergency Fund, Travel, Investments',
    noSalaryRegisteredThisMonth: 'No salary registered for this month',
    registerIncomeFor503020: 'Log your monthly income to apply the automatic 50/30/20 split.',
    monthlyAllocationHeader: '50/30/20 Budget Allocation',
    spentLabel: 'Spent',
    availableLabel: 'Available',
    monthlyCeilingLabel: 'Monthly Ceiling',
  },
};

export function getLanguageCode(langString?: string): SupportedLanguage {
  if (!langString) return 'pt';
  const lower = langString.toLowerCase();
  if (lower.includes('en') || lower.includes('ingl') || lower.includes('english')) {
    return 'en';
  }
  return 'pt';
}

/**
 * Retorna o rótulo de categoria traduzido para despesas fixas
 */
export function getFixedExpenseCategoryLabel(category: string, t: Translations): string {
  const norm = (category || '').trim().toLowerCase();
  if (norm.includes('habita') || norm.includes('casa') || norm.includes('hous') || norm.includes('rent') || norm.includes('renda')) {
    return t.catHousing;
  }
  if (
    norm.includes('servi') ||
    norm.includes('energ') ||
    norm.includes('água') ||
    norm.includes('agua') ||
    norm.includes('util') ||
    norm.includes('luz') ||
    norm.includes('bill')
  ) {
    return t.catUtilities;
  }
  if (
    norm.includes('telecom') ||
    norm.includes('net') ||
    norm.includes('wifi') ||
    norm.includes('internet') ||
    norm.includes('tv') ||
    norm.includes('phone') ||
    norm.includes('telemóvel') ||
    norm.includes('telemovel')
  ) {
    return t.catTelecom;
  }
  if (
    norm.includes('saúde') ||
    norm.includes('saude') ||
    norm.includes('health') ||
    norm.includes('medic') ||
    norm.includes('seguro')
  ) {
    return t.catHealth;
  }
  return t.catOther;
}
