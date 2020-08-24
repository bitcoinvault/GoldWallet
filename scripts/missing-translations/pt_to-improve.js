const pt = {
  _: {
    languageCode: 'pt',
    storage_is_encrypted: 'O seu armazenamento está encriptado. A palavra-passe é necessária para desencriptá-lo',
    enter_password: 'Introduzir palavra-passe',
    bad_password: 'Palavra-passe incorrecta, tente novamente',
    never: 'nunca',
    continue: 'Continuar',
    ok: 'OK',
    click: 'Clique',
    here: 'Aqui',
    save: 'Guardar',
    confirm: 'Confirmar',
    copy: 'Copiar',
    copied: 'Copiado!',
    or: 'TRANSLATION NEEDED | ENG: or',
    delete: 'TRANSLATION NEEDED | ENG: Delete',
    created: 'TRANSLATION NEEDED | ENG: Created on',
    invalid: 'TRANSLATION NEEDED | ENG: Invalid',
    satoshi: 'TRANSLATION NEEDED | ENG: Sat',
    next: 'TRANSLATION NEEDED | ENG: Next',
  },
  tabNavigator: {
    dashboard: 'Menu Principal',
    settings: 'Definições',
    addressBook: 'Lista de endereços',
    wallets: 'TRANSLATION NEEDED | ENG: Wallets',
    authenticators: 'TRANSLATION NEEDED | ENG: Authenticators',
  },
  message: {
    somethingWentWrong: 'Alguma coisa correu mal',
    somethingWentWrongWhileCreatingWallet: 'Alguma coisa correu mal enquanto criava a sua carteira. Volte ao Painel e tente novamente.',
    success: 'Sucesso',
    successfullWalletImport: 'A importação da sua carteira foi realizada com sucesso. Pode voltar ao Painel.',
    successfullWalletDelete: 'A sua carteira foi excluída com sucesso. Pode voltar ao Painel.',
    returnToDashboard: 'Voltar ao Painel',
    creatingWallet: 'Criação da sua carteira',
    creatingWalletDescription: 'Estamos a criar a sua carteira. Este procedimento pode demorar um pouco. Agradecemos a sua compreensão.',
    allDone: 'TRANSLATION NEEDED | ENG: All done!',
    hooray: 'TRANSLATION NEEDED | ENG: Hooray!',
    cancelTxSuccess: 'TRANSLATION NEEDED | ENG: You have successfully canceled your transaction.\nYour coins are on the way.',
    wrongMnemonic: 'TRANSLATION NEEDED | ENG: Wrong mnemonic',
    wrongMnemonicDesc: 'TRANSLATION NEEDED | ENG: Your mnemonic does not match any supported wallet. You are trying to import an invalid mnemonic or wallet that has never been used',
    returnToWalletChoose: 'TRANSLATION NEEDED | ENG: Return to the wallet type selection',
    returnToWalletImport: 'TRANSLATION NEEDED | ENG: Return to wallet import',
    generateAddressesError: 'TRANSLATION NEEDED | ENG: Couldn`t generate addresses',
    noTransactions: 'TRANSLATION NEEDED | ENG: No transactions found on the wallet',
    noTransactionsDesc: 'TRANSLATION NEEDED | ENG: You are probably trying to import a wallet that has never been used',
    returnToAuthenticators: 'TRANSLATION NEEDED | ENG: Return to Authenticators',
    creatingAuthenticator: 'TRANSLATION NEEDED | ENG: Creating your authenticator',
    creatingAuthenticatorDescription: 'TRANSLATION NEEDED | ENG: Please be patient while we create your authenticator.\nIt may take a while.',
    importingAuthenticator: 'TRANSLATION NEEDED | ENG: Importing your authenticator',
    importingAuthenticatorDescription: 'TRANSLATION NEEDED | ENG: Please be patient while we import your authenticator.\nIt may take a while.',
  },
  onboarding: {
    onboarding: 'Definir credenciais',
    pin: 'PIN',
    createPin: 'Definir PIN',
    createNewPin: 'Novo PIN',
    createPassword: 'Criar palavra-passe de transacção',
    createPinDescription: 'O seu PIN será utilizado para iniciar sessão na aplicação. Poderá alterá-lo posteriormente no menu Definições.',
    confirmPin: 'Confirmar PIN',
    confirmNewPin: 'Confirmar novo PIN',
    confirmPassword: 'Confirmar palavra-passe de transacção',
    passwordDoesNotMatch: 'As palavras-passe não correspondem. Por favor, introduza uma palavra-passe válida.',
    createPasswordDescription: 'A palavra-passe de transacção será utilizada para verificar todas as suas transacções. Informamos de que esta palavra-passe não pode ser alterada. A palavra-passe de transacção deve conter pelo menos 8 caracteres alfanuméricos.',
    changePin: 'Alterar PIN',
    currentPin: 'PIN actual',
    pinDoesNotMatch: 'O PIN introduzido não corresponde. Por favor, introduza um PIN válido',
    successDescription: 'Parabéns! \nDefiniu com sucesso o seu código PIN.',
    successDescriptionChangedPin: 'Parabéns! \nAlterou com sucesso o seu código PIN.',
    successButton: 'Ir ao Menu Principal',
    successButtonChangedPin: 'Voltar ao menu Definições',
  },
  unlock: {
    title: 'Desbloquear',
    touchID: 'Touch ID para \"Gold Wallet\"',
    confirmButton: 'Introduza a sua impressão digital para continuar.',
    enter: 'Introduza o PIN',
  },
  unlockTransaction: {
    headerText: 'Confirmar transacção',
    title: 'Confirmar palavra-passe de transacção',
    description: 'Confirme a palavra-passe de transacção para proceder com a transacção',
  },
  wallets: {
    dashboard: {
      title: 'Carteiras',
      allWallets: 'Todas as Wallets',
      noWallets: 'Sem carteiras',
      noWalletsDesc1: 'Nenhuma carteira para apresentar.',
      noWalletsDesc2: 'adicionar a sua primeira carteira.',
      send: 'Enviar moedas',
      receive: 'Receber moedas',
      noTransactions: 'Nenhuma transacção para apresentar.',
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance',
      wallet: 'TRANSLATION NEEDED | ENG: wallet',
      recover: 'TRANSLATION NEEDED | ENG: Cancel',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Carteiras',
    },
    importWallet: {
      title: 'Importar a sua carteira',
      header: 'Importar carteira',
      subtitle: 'Anote aqui a sua mnemónica, chave privada, WIF ou o que tiver. GoldWallet fará o melhor para descobrir o formato correto e importar a sua carteira',
      placeholder: 'Mnemónica, chave privada, WIF',
      import: 'Importar',
      scanQrCode: 'ou analisar o código de QR',
      walletInUseValidationError: 'Essa carteira já está a ser usada. Introduza uma carteira válida.',
      chooseTypeDescription: 'TRANSLATION NEEDED | ENG: Choose the type of the wallet you want to import.',
      importARDescription1: 'TRANSLATION NEEDED | ENG: Enter the seed phrase',
      importARDescription2: 'TRANSLATION NEEDED | ENG: scan the QR code of the wallet you want to import',
      scanWalletAddress: 'TRANSLATION NEEDED | ENG: Scan wallet address',
      scanWalletAddressDescription: 'TRANSLATION NEEDED | ENG: Scan the Public Address QR code to start the integration with GoldWallet.',
      scanFastPubKey: 'TRANSLATION NEEDED | ENG: Scan the Fast Key QR code',
      scanCancelPubKey: 'TRANSLATION NEEDED | ENG: Scan the Cancel Key QR code',
      scanPublicKeyDescription: 'TRANSLATION NEEDED | ENG: Open the first PDF document you generated when you created the wallet you want to import and use this app to scan the Public Key QR code.',
      unsupportedElectrumVaultMnemonic: 'TRANSLATION NEEDED | ENG: This seed is from Electrum Vault and is currently not supported. Will be supported in the near future.',
    },
    exportWallet: {
      title: 'Frase da mnemónica',
      header: 'Exportar carteira',
    },
    exportWalletXpub: {
      header: 'Carteira XPUB',
    },
    deleteWallet: {
      title: 'Excluir a sua carteira',
      header: 'Excluir carteira',
      description1: 'Tem certeza de que deseja excluir',
      description2: '? Não pode anular esta acção.',
      no: 'Não',
      yes: 'Sim',
    },
    wallet: {
      none: 'Nenhum',
      latest: 'Transacção mais recente',
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance',
    },
    add: {
      title: 'Adicionar nova carteira',
      subtitle: 'Nome da sua carteira',
      description: 'Introduza um nome para a sua nova carteira.',
      inputLabel: 'Nome',
      addWalletButton: 'Adicionar nova carteira',
      importWalletButton: 'Importar carteira',
      advancedOptions: 'Opções avançadas',
      multipleAddresses: 'Múltiplos endereços',
      singleAddress: 'Um endereço',
      segwidAddress: 'Contém uma árvore de endereços de segmento nativos, gerados a partir de uma única semente de 24 palavras',
      failed: 'TRANSLATION NEEDED | ENG: Failed to create wallet',
      walletType: 'TRANSLATION NEEDED | ENG: Wallet type',
      ar: 'TRANSLATION NEEDED | ENG: Makes Standard and Cancel transactions.',
      air: 'TRANSLATION NEEDED | ENG: Makes Standard, Cancel, and Fast transactions.',
      legacyTitle: 'TRANSLATION NEEDED | ENG: Legacy',
      legacyHDP2SHTitle: 'TRANSLATION NEEDED | ENG: Legacy HD P2SH',
      legacyP2SHTitle: 'TRANSLATION NEEDED | ENG: Legacy P2SH',
      legacyHDSegWitTitle: 'TRANSLATION NEEDED | ENG: Legacy HD SegWit',
      legacy: 'TRANSLATION NEEDED | ENG: Makes default types of transactions.',
      legacyHDP2SH: 'TRANSLATION NEEDED | ENG: It contains a tree of P2SH addresses generated from a single 24-word seed',
      LegacyP2SH: 'TRANSLATION NEEDED | ENG: It contains a single P2SH address',
      LegacyHDSegWit: 'TRANSLATION NEEDED | ENG: It contains a tree of native segwit addresses, generated from a single 24-word seed',
      publicKeyError: 'TRANSLATION NEEDED | ENG: Provided public key is invalid',
    },
    addSuccess: {
      title: 'Adicionar nova carteira',
      subtitle: 'Sucesso',
      description: 'A sua carteira foi criada. Tire um momento para anotar esta frase da mnemónica num papel. É a sua cópia de segurança. Pode usá-la para repor a carteira noutros dispositivos.',
      okButton: 'OK, anotei-a!',
    },
    details: {
      edit: 'Editar',
      latestTransaction: 'Transacção mais recente',
      typeLabel: 'Tipo',
      nameLabel: 'Nome',
      exportWallet: 'Exportar carteira',
      showWalletXPUB: 'Apresentar carteira XPUB',
      deleteWallet: 'Excluir carteira',
      nameEdit: 'Editar nome',
    },
    export: {
      title: 'exportar carteira',
    },
    import: {
      title: 'Importar',
      explanation: 'Anote aqui a sua mnemónica, chave privada, WIF ou o que tiver. GoldWallet fará o melhor para descobrir o formato correto e importar a sua carteira',
      imported: 'Importada',
      error: 'Falha na importação. Garanta que os dados fornecidos são válidos.',
      success: 'Sucesso',
      do_import: 'Importar',
      scan_qr: 'ou analisar o código de QR?',
    },
    scanQrWif: {
      go_back: 'Voltar',
      cancel: 'Cancelar',
      decoding: 'Descodificação',
      input_password: 'Introduzir palavra-passe',
      password_explain: 'Esta é a chave privada encriptada BIP38',
      bad_password: 'Palavra-passe incorrecta',
      wallet_already_exists: 'Essa carteira já existe',
      bad_wif: 'WIF errada',
      imported_wif: 'WIF importada',
      with_address: 'com endereço',
      imported_segwit: 'SegWit importado',
      imported_legacy: 'Legacy importado',
      imported_watchonly: 'Ver apenas importado',
    },
    publicKey: {
      recoverySubtitle: 'TRANSLATION NEEDED | ENG: Add Cancel Key',
      webKeyGenerator: 'TRANSLATION NEEDED | ENG: Web Key Generator:',
      recoveryDescription: 'TRANSLATION NEEDED | ENG: Go to the web Key Generator on a separate device and use this app to scan the Public Key QR code. Remember to export your keys as a PDF!',
      instantSubtitle: 'TRANSLATION NEEDED | ENG: Add Fast Key',
      instantDescription: 'TRANSLATION NEEDED | ENG: Go to the web Key Generator on a separate device and use this app to scan the Public Key QR code. Remember to export your keys as a PDF!',
      scan: 'TRANSLATION NEEDED | ENG: Scan',
    },
    errors: {
      invalidMnemonicWordsNumber: 'TRANSLATION NEEDED | ENG: Provided {receivedWordsNumber} words expected {expectedWordsNumber}',
      noIndexForWord: 'TRANSLATION NEEDED | ENG: Couldn't find index for word: {word}',
      invalidPrivateKey: 'TRANSLATION NEEDED | ENG: Invalid private key',
      invalidPublicKey: 'TRANSLATION NEEDED | ENG: Invalid public key',
      invalidMnemonic: 'TRANSLATION NEEDED | ENG: Invalid mnemonic',
      invalidQrCode: 'TRANSLATION NEEDED | ENG: Invalid QR code',
      invalidSign: 'TRANSLATION NEEDED | ENG: Couldn't sign transaction',
      duplicatedPublicKey: 'TRANSLATION NEEDED | ENG: The public key has already been added',
    },
  },
  transactions: {
    list: {
      conf: 'Confirmações',
    },
    details: {
      title: 'Transacção',
      detailTitle: 'Detalhes da transacção',
      transactionHex: 'Transacção hexagonal',
      transactionHexDescription: 'Esta é uma transacção hexagonal, assinada e preparada para transmitir à rede',
      copyAndBoriadcast: 'Copiar e transmitir mais tarde',
      verify: 'Verificar em coinb.in',
      amount: 'Montante',
      fee: 'Taxa',
      txSize: 'Tamanho de TX',
      satoshiPerByte: 'Satoshi por byte',
      from: 'De',
      to: 'Para',
      bytes: 'bytes',
      copy: 'Copiar',
      noLabel: 'Sem etiqueta',
      details: 'Detalhes',
      transactionId: 'ID da Transação',
      confirmations: 'confirmações',
      transactionDetails: 'Detalhes da transação',
      viewInBlockRxplorer: 'Ver no explorador de blocos',
      addNote: 'Adicionar nota',
      note: 'Nota',
      inputs: 'Entradas',
      ouputs: 'Saídas',
      sendCoins: 'Enviar moedas',
      transactionType: 'TRANSLATION NEEDED | ENG: Transaction type',
      transactioFee: 'TRANSLATION NEEDED | ENG: Transaction fee',
      walletType: 'TRANSLATION NEEDED | ENG: Wallet type',
      addToAddressBook: 'TRANSLATION NEEDED | ENG: Add to Address book',
      timePending: 'TRANSLATION NEEDED | ENG: Time pending',
    },
    errors: {
      notEnoughBalance: 'TRANSLATION NEEDED | ENG: Not enough balance. Please, try sending a smaller amount.',
    },
    label: {
      pending: 'TRANSLATION NEEDED | ENG: pending',
      annulled: 'TRANSLATION NEEDED | ENG: annulled',
      done: 'TRANSLATION NEEDED | ENG: done',
      canceled: 'TRANSLATION NEEDED | ENG: canceled',
    },
    transactionTypeLabel: {
      standard: 'TRANSLATION NEEDED | ENG: Standard',
      canceled: 'TRANSLATION NEEDED | ENG: Canceled',
      fast: 'TRANSLATION NEEDED | ENG: Fast',
    },
  },
  send: {
    header: 'Enviar moedas',
    success: {
      title: 'Sucesso',
      description: 'Parabéns! Terminou a transacção com sucesso.',
      done: 'Pronto',
      return: 'Voltar ao Painel',
    },
    details: {
      title: 'criar transacção',
      amount_field_is_not_valid: 'O campo do montante não é válido',
      fee_field_is_not_valid: 'O campo da taxa não é válido',
      address_field_is_not_valid: 'O campo do endereço não é válido',
      create_tx_error: 'Houve um erro na criação da transacção. Garanta que o endereço é válido.',
      address: 'endereço',
      amount_placeholder: 'montante a enviar (em BTCV)',
      fee_placeholder: 'mais taxa da transacção (em BTCV)',
      note_placeholder: 'nota para si mesmo',
      cancel: 'Cancelar',
      scan: 'Analisar',
      send: 'Enviar',
      next: 'Seguinte',
      note: 'Nota (opcional)',
      to: 'para',
      feeUnit: 'Sat/B',
      fee: 'Taxa:',
      create: 'Criar fatura',
      remaining_balance: 'Saldo remanescente',
      total_exceeds_balance: 'O montante a enviar excede o saldo disponível.',
    },
    confirm: {
      sendNow: 'Enviar agora',
      cancelNow: 'TRANSLATION NEEDED | ENG: Cancel now',
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance after transaction',
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance after transaction',
    },
    create: {
      amount: 'Montante',
      fee: 'Taxa',
      setTransactionFee: 'Configurar uma taxa de transacção',
      headerText: 'Quando existe um grande número de transacções pendentes na rede (>1500), a taxa mais alta irá resultar no processamento mais rápido da sua transacção. Os valores normais são 1-500 sat/b',
    },
    recovery: {
      recover: 'TRANSLATION NEEDED | ENG: Cancel',
      useWalletAddress: 'TRANSLATION NEEDED | ENG: Use address of this wallet',
      confirmSeed: 'TRANSLATION NEEDED | ENG: Confirm with Cancel Seed Phrase',
      confirmSeedDesc: 'TRANSLATION NEEDED | ENG: Open the PDF document you generated when you created your wallet and write down the Private Key seed phrase in the same order.',
      confirmFirstSeed: 'TRANSLATION NEEDED | ENG: Confirm with Cancel Seed Phrase',
      confirmFirstSeedDesc: 'TRANSLATION NEEDED | ENG: Open the first PDF document you generated when you created your wallet and write down the Private Key seed phrase in the same order.',
      confirmSecondSeed: 'TRANSLATION NEEDED | ENG: Confirm with Fast Seed Phrase',
      confirmSecondSeedDesc: 'TRANSLATION NEEDED | ENG: Open the second PDF document you generated when you created your wallet and write down the Private Key seed phrase in the same order.',
    },
    transaction: {
      instant: 'TRANSLATION NEEDED | ENG: Fast',
      instantDesc: 'TRANSLATION NEEDED | ENG: This transaction will be confirmed immediately. Use with extreme caution.',
      fastSuccess: 'TRANSLATION NEEDED | ENG: You have successfully made your fast transaction.',
      alert: 'TRANSLATION NEEDED | ENG: Standard',
      alertDesc: 'TRANSLATION NEEDED | ENG: This transaction needs 144 blocks or about 24 hours to be confirmed. You can cancel it within this time.',
      type: 'TRANSLATION NEEDED | ENG: Transaction type',
      scanInstantKeyTitle: 'TRANSLATION NEEDED | ENG: Scan the Fast Key',
      scanInstantKeyDesc: 'TRANSLATION NEEDED | ENG: Open the PDF document you generated when you created your wallet and scan the Private Key QR code to send the transaction.',
      lightningError: 'TRANSLATION NEEDED | ENG: This address appears to be for a Lightning invoice. Please, go to your Lightning wallet in order to make a payment for this invoice.',
      watchOnlyError: 'TRANSLATION NEEDED | ENG: Watch only wallets cannot send transactions',
    },
  },
  receive: {
    header: 'Receber moedas',
    details: {
      amount: 'Montante',
      share: 'Partilhar',
      receiveWithAmount: 'Receber com o montante',
    },
  },
  settings: {
    language: 'Idioma',
    general: 'Geral',
    security: 'Segurança',
    about: 'Sobre',
    electrumServer: 'Servidor Electrum',
    advancedOptions: 'Opções avançadas',
    changePin: 'Alterar PIN',
    fingerprintLogin: 'Iniciar sessão com impressão digital',
    aboutUs: 'Sobre nós',
    header: 'Definições',
    notSupportedFingerPrint: 'O seu dispositivo não suporta impressão digital',
    TouchID: 'Permitir impressão digital',
    FaceID: 'Permitir FaceID',
    Biometrics: 'Permitir dados biométricos',
  },
  aboutUs: {
    header: 'Sobre nós',
    releaseNotes: 'Notas de lançamento',
    runSelfTest: 'Executar teste próprio',
    buildWithAwesome: 'Construir com Awesome:',
    rateGoldWallet: 'Classificar GoldWallet',
    goToOurGithub: 'Ir para Github',
    alwaysBackupYourKeys: 'Realizar sempre uma cópia de segurança nas suas chaves',
    title: 'A Gold Wallet é grátis, tratando-se de uma carteira gratuita do Bitcoin Vault. Licenciada pelo MIT.',
  },
  electrumServer: {
    header: 'Servidor Electrum',
    title: 'Alterar o Servidor Electrum',
    description: 'Poderá alterar o endereço do servidor ao qual é efectuada a ligação. O endereço padrão é recomendado.',
    save: 'Guardar',
    useDefault: 'Usar predefinição',
    host: 'anfitrião',
    port: 'porta',
    successfullSave: 'As suas alterações foram guardadas com sucesso. A reinicialização pode ser exigida para que as alterações tenham efeito.',
    connectionError: 'Não está a ser possível efectuar a ligação ao servidor Electrum fornecido  ',
  },
  advancedOptions: {
    title: 'Configurar opções avançadas',
    description: 'A activação das Opções Avançadas permitirá escolher entre os tipos de carteira listados abaixo: \nP2SH, HD P2SH, HD segwit.',
  },
  selectLanguage: {
    header: 'Idioma',
    restartInfo: 'Quando um novo idioma é seleccionado, o reinício da aplicação GoldWallet pode ser exigido para esta alteração ter efeito',
    confirmation: 'Confirmação',
    confirm: 'Confirmar',
    alertDescription: 'Seleccionar o idioma e reiniciar a aplicação?',
    cancel: 'Cancelar',
  },
  contactList: {
    cancel: 'Cancelar',
    search: 'Pesquisar',
    screenTitle: 'Lista de endereços',
    noContacts: 'Sem contactos',
    noContactsDesc1: 'Sem contactos para apresentar. \nClicar',
    noContactsDesc2: 'para adicionar o seu primeiro contacto.',
    noResults: 'Sem resultados para',
  },
  contactCreate: {
    screenTitle: 'Adicionar novo contacto',
    subtitle: 'Novo contacto',
    description: 'Introduza um nome e um endereço\npara o seu novo contacto.',
    nameLabel: 'Nome',
    addressLabel: 'Endereço',
    buttonLabel: 'Adicionar novo contacto',
    successTitle: 'Sucesso',
    successDescription: 'Parabéns! Adicionou o seu contacto\ncom sucesso.',
    successButton: 'Voltar à Lista de endereços',
  },
  contactDetails: {
    nameLabel: 'Nome',
    addressLabel: 'Endereço',
    editName: 'Editar nome',
    editAddress: 'Editar endereço',
    sendCoinsButton: 'Enviar moedas',
    showQRCodeButton: 'Apresentar Código QR',
    deleteButton: 'Eliminar contacto',
    share: 'Partilhar',
  },
  contactDelete: {
    title: 'Eliminar o seu contacto',
    header: 'Eliminar contacto',
    description1: 'Tem certeza de que deseja excluir',
    description2: '?\nNão pode anular esta ação.',
    no: 'Não',
    yes: 'Sim',
    success: 'Sucesso',
    successDescription: 'O seu contacto foi excluído com sucesso.\nPode voltar à Lista de endereços.',
    successButton: 'Voltar à Lista de endereços',
  },
  scanQrCode: {
    permissionTitle: 'Permissão para usar a câmara',
    permissionMessage: 'Precisamos da sua permissão para usar a sua câmara',
    ok: 'OK',
    cancel: 'Cancelar',
  },
  filterTransactions: {
    header: 'Filtrar transacções',
    receive: 'receber',
    send: 'enviar',
    filter: 'filtrar',
    to: 'para',
    toAmount: 'Montante máximo',
    toDate: 'Data de Fim',
    from: 'de',
    fromAmount: 'Montante mínimo',
    fromDate: 'Data de Início',
    clearFilters: 'apagar filtros',
    received: 'TRANSLATION NEEDED | ENG: Received',
    sent: 'TRANSLATION NEEDED | ENG: Sent',
    transactionType: 'TRANSLATION NEEDED | ENG: Transaction type',
    transactionStatus: 'TRANSLATION NEEDED | ENG: Transaction status',
    status: {
      pending: 'TRANSLATION NEEDED | ENG: Pending',
      annulled: 'TRANSLATION NEEDED | ENG: Annulled',
      done: 'TRANSLATION NEEDED | ENG: Done',
      canceled: 'TRANSLATION NEEDED | ENG: Canceled',
    },
  },
  authenticators: {
    sign: {
      error: 'TRANSLATION NEEDED | ENG: None of the authenticators were able to sign the transaction',
    },
    options: {
      title: 'TRANSLATION NEEDED | ENG: Authenticator options',
      export: 'TRANSLATION NEEDED | ENG: Export authenticator',
      pair: 'TRANSLATION NEEDED | ENG: Pair authenticator',
      sectionTitle: 'TRANSLATION NEEDED | ENG: General',
      delete: 'TRANSLATION NEEDED | ENG: Delete authenticator',
    },
    pair: {
      title: 'TRANSLATION NEEDED | ENG: Pair authenticator',
      pin: 'TRANSLATION NEEDED | ENG: PIN',
      publicKey: 'TRANSLATION NEEDED | ENG: Public Key',
      descPin: 'TRANSLATION NEEDED | ENG: Use this PIN to confirm authenticator pairing on your desktop application.',
      descPublicKey: 'TRANSLATION NEEDED | ENG: You can use this Public Key to import your authenticator in the desktop application during the wallet creation process with the GoldWallet option.',
    },
    import: {
      title: 'TRANSLATION NEEDED | ENG: Import authenticator',
      success: 'TRANSLATION NEEDED | ENG: You have successfully imported your authenticator. It is now ready to use.',
      subtitle: 'TRANSLATION NEEDED | ENG: Import your authenticator',
      desc1: 'TRANSLATION NEEDED | ENG: Write down the seed phrase or scan the QR code of the authenticator you want to import.',
      desc2: 'TRANSLATION NEEDED | ENG: scan QR code by clicking on “or scan QR code” below',
      textAreaPlaceholder: 'TRANSLATION NEEDED | ENG: Seed phrase',
    },
    export: {
      title: 'TRANSLATION NEEDED | ENG: Export authenticator',
    },
    delete: {
      title: 'TRANSLATION NEEDED | ENG: Delete authenticator',
      subtitle: 'TRANSLATION NEEDED | ENG: Delete your authenticator',
      success: 'TRANSLATION NEEDED | ENG: Your authenticator has been successfully deleted. You can always create a new one.',
    },
    list: {
      noAuthenticatorsDesc1: 'TRANSLATION NEEDED | ENG: Tap',
      noAuthenticatorsDesc2: 'TRANSLATION NEEDED | ENG: to add your first authenticator.',
      noAuthenticators: 'TRANSLATION NEEDED | ENG: No Authenticators yet',
      scan: 'TRANSLATION NEEDED | ENG: Scan',
      title: 'TRANSLATION NEEDED | ENG: Bitcoin Vault authenticators',
    },
    add: {
      successTitle: 'TRANSLATION NEEDED | ENG: Your authenticator is ready!',
      title: 'TRANSLATION NEEDED | ENG: Add new authenticator',
      subtitle: 'TRANSLATION NEEDED | ENG: Pair authenticator',
      successDescription: 'TRANSLATION NEEDED | ENG: Write down this seed phrase somewhere safe. It's your backup in case you need to restore your authenticator. Remember that the authenticator is necessary to confirm Fast and Cancel transactions.',
      description: 'TRANSLATION NEEDED | ENG: Open your Electrum Vault desktop application and create a new wallet. Follow the steps on the screen until you see a QR code. Use this app to scan it to proceed.',
      subdescription: 'TRANSLATION NEEDED | ENG: You can also import your authenticator by choosing the option below.',
    },
    enterPIN: {
      subtitle: 'TRANSLATION NEEDED | ENG: Enter PIN',
      description: 'TRANSLATION NEEDED | ENG: Enter this PIN into the Electrum Vault desktop application to finish the pairing process.',
    },
  },
  calendar: {
    monthNames: {
      january: 'TRANSLATION NEEDED | ENG: January',
      february: 'TRANSLATION NEEDED | ENG: February',
      march: 'TRANSLATION NEEDED | ENG: March',
      april: 'TRANSLATION NEEDED | ENG: April',
      may: 'TRANSLATION NEEDED | ENG: May',
      june: 'TRANSLATION NEEDED | ENG: June',
      july: 'TRANSLATION NEEDED | ENG: July',
      august: 'TRANSLATION NEEDED | ENG: August',
      september: 'TRANSLATION NEEDED | ENG: September',
      october: 'TRANSLATION NEEDED | ENG: October',
      november: 'TRANSLATION NEEDED | ENG: November',
      december: 'TRANSLATION NEEDED | ENG: December',
    },
    monthNamesShort: {
      january: 'TRANSLATION NEEDED | ENG: Jan',
      february: 'TRANSLATION NEEDED | ENG: Feb',
      march: 'TRANSLATION NEEDED | ENG: Mar',
      april: 'TRANSLATION NEEDED | ENG: Apr',
      may: 'TRANSLATION NEEDED | ENG: May',
      june: 'TRANSLATION NEEDED | ENG: Jun',
      july: 'TRANSLATION NEEDED | ENG: Hul',
      august: 'TRANSLATION NEEDED | ENG: Aug',
      september: 'TRANSLATION NEEDED | ENG: Sep',
      october: 'TRANSLATION NEEDED | ENG: Oct',
      november: 'TRANSLATION NEEDED | ENG: Nov',
      december: 'TRANSLATION NEEDED | ENG: Dec',
    },
    dayNames: {
      sunday: 'TRANSLATION NEEDED | ENG: Sunday',
      monday: 'TRANSLATION NEEDED | ENG: Monday',
      tuesday: 'TRANSLATION NEEDED | ENG: Tuesday',
      wednesday: 'TRANSLATION NEEDED | ENG: Wednesday',
      thursday: 'TRANSLATION NEEDED | ENG: Thursday',
      friday: 'TRANSLATION NEEDED | ENG: Friday',
      saturday: 'TRANSLATION NEEDED | ENG: Saturday',
    },
    dayNamesShort: {
      sunday: 'TRANSLATION NEEDED | ENG: Sun',
      monday: 'TRANSLATION NEEDED | ENG: Mon',
      tuesday: 'TRANSLATION NEEDED | ENG: Tue',
      wednesday: 'TRANSLATION NEEDED | ENG: Wed',
      thursday: 'TRANSLATION NEEDED | ENG: Thu',
      friday: 'TRANSLATION NEEDED | ENG: Fri',
      saturday: 'TRANSLATION NEEDED | ENG: Sat',
    },
    today: 'TRANSLATION NEEDED | ENG: Today',
  },
}
