const es = {
  _: {
    languageCode: 'es',
    storage_is_encrypted: 'Su almacenamiento está cifrado. Se requiere contraseña para descifrarlo',
    enter_password: 'Escribir contraseña',
    bad_password: 'Contraseña incorrecta, inténtelo nuevamente',
    never: 'nunca',
    continue: 'Continuar',
    ok: 'Aceptar',
    click: 'Clic',
    here: 'aquí',
    save: 'Guardar',
    confirm: 'Confirmar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    or: 'TRANSLATION NEEDED | ENG: or',
    delete: 'TRANSLATION NEEDED | ENG: Delete',
    created: 'TRANSLATION NEEDED | ENG: Created',
    invalid: 'TRANSLATION NEEDED | ENG: Invalid',
    satoshi: 'TRANSLATION NEEDED | ENG: Sat',
    next: 'TRANSLATION NEEDED | ENG: Next',
  },
  tabNavigator: {
    dashboard: 'Panel',
    settings: 'Configuración',
    addressBook: 'Libreta de direcciones',
    wallets: 'TRANSLATION NEEDED | ENG: Wallets',
    authenticators: 'TRANSLATION NEEDED | ENG: Authenticators',
  },
  message: {
    somethingWentWrong: 'Algo salió mal',
    somethingWentWrongWhileCreatingWallet: 'Algo salió mal mientras estábamos creando su monedero. Vuelva al Panel e inténtelo nuevamente.',
    success: 'Completado',
    successfullWalletImport: 'Su monedero ha sido importado correctamente. Ahora puede volver al Panel.',
    successfullWalletDelete: 'Su monedero ha sido eliminado correctamente. Ahora puede volver al Panel.',
    returnToDashboard: 'Volver al Panel',
    creatingWallet: 'Creación de su monedero',
    creatingWalletDescription: 'Tenga paciencia mientras creamos su monedero. Puede que lleve un tiempo.',
    wrongMnemonic: 'TRANSLATION NEEDED | ENG: Wrong mnemonic',
    wrongMnemonicDesc: 'TRANSLATION NEEDED | ENG: Your mnemonic does not match any supported wallet. You are trying to import an invalid mnemonic or wallet that has never been used',
    returnToWalletChoose: 'TRANSLATION NEEDED | ENG: Return to the wallet type selection',
    returnToWalletImport: 'TRANSLATION NEEDED | ENG: Return to wallet import',
    generateAddressesError: 'TRANSLATION NEEDED | ENG: Couldn`t generate addresses',
    noTransactions: 'TRANSLATION NEEDED | ENG: No transactions found on the wallet',
    noTransactionsDesc: 'TRANSLATION NEEDED | ENG: You are probably trying to import a wallet that has never been used',
    returnToAuthenticators: 'TRANSLATION NEEDED | ENG: Return to Authenticators',
    creatingAuthenticator: 'TRANSLATION NEEDED | ENG: Creating your authenticator',
    creatingAuthenticatorDescription: 'TRANSLATION NEEDED | ENG: Please be patient while we create your authenticator. It may take a while.',
    importingAuthenticator: 'TRANSLATION NEEDED | ENG: Importing your authenticator',
    importingAuthenticatorDescription: 'TRANSLATION NEEDED | ENG: Please be patient while we import your authenticator. It may take a while.',
  },
  onboarding: {
    onboarding: 'Configuración inicial',
    pin: 'PIN',
    createPin: 'Crear PIN',
    createNewPin: 'Nuevo PIN',
    createPassword: 'Crear contraseña de transacción',
    createPinDescription: 'Su PIN se utilizará para acceder a la aplicación. Puede cambiarlo más tarde en la sección de Configuración.',
    confirmPin: 'Confirmar PIN',
    confirmNewPin: 'Confirmar nuevo PIN',
    confirmPassword: 'Confirmar contraseña de transacción',
    passwordDoesNotMatch: 'La contraseña no coincide. Por favor, introduzca una contraseña válida.',
    createPasswordDescription: 'Su contraseña de transacción se utilizará para verificar todas las transacciones. No podrá cambiarla más tarde. La contraseña de transacción debe contener al menos 8 caracteres alfanuméricos.',
    changePin: 'Cambiar PIN',
    currentPin: 'PIN actual',
    pinDoesNotMatch: 'El PIN no coincide. Por favor, introduzca un PIN válido.',
    successDescription: '¡Bravo! \n Ha creado con éxito su PIN.',
    successDescriptionChangedPin: '¡Bravo! \n Ha cambiado con éxito su PIN.',
    successButton: 'Ir al Panel',
    successButtonChangedPin: 'Volver a Configuración',
  },
  unlock: {
    title: 'Desbloquear',
    touchID: 'Touch ID para «Gold Wallet»',
    confirmButton: 'Confirmar la huella digital para continuar.',
    enter: 'Introducir PIN',
  },
  unlockTransaction: {
    headerText: 'Confirmar transacción',
    title: 'Confirmar la contraseña de transacción',
    description: 'Confirmar la contraseña de transacción para proceder a la transacción.',
  },
  wallets: {
    dashboard: {
      title: 'Monederos',
      allWallets: 'Todas las carteras',
      noWallets: 'No hay monederos',
      noWalletsDesc1: 'No hay monederos para mostrar.',
      noWalletsDesc2: 'para agregar su primer monedero.',
      send: 'Enviar monedas',
      receive: 'Recibir monedas',
      noTransactions: 'No hay transacciones para mostrar.',
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance',
      recover: 'TRANSLATION NEEDED | ENG: Recover',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Monederos',
    },
    importWallet: {
      title: 'Importe su monedero',
      header: 'Importar monedero',
      subtitle: 'Escriba aquí su frase mnemotécnica, clave privada, WIF o cualquier dato que tenga. GoldWallet hará todo lo posible para adivinar el formato correcto e importar su monedero.',
      placeholder: 'Frase mnemotécnica, clave privada, WIF',
      import: 'Importar',
      scanQrCode: 'o escanear el código QR',
      walletInUseValidationError: 'El monedero ya está en uso. Introduzca un monedero válido.',
      chooseTypeDescription: 'TRANSLATION NEEDED | ENG: Please choose type of the wallet which you want to import.',
      importARDescription1: 'TRANSLATION NEEDED | ENG: Please write your mnemonic in order to import your wallet',
      importARDescription2: 'TRANSLATION NEEDED | ENG: scan QR code by clicking on “or scan QR code” below',
      scanWalletAddress: 'TRANSLATION NEEDED | ENG: Scan wallet address',
      scanWalletAddressDescription: 'TRANSLATION NEEDED | ENG: Scan the Public Address QR code to start the integration with GoldWallet.',
      scanPublicKey: 'TRANSLATION NEEDED | ENG: Scan Public Key',
      scanPublicKeyDescription: 'TRANSLATION NEEDED | ENG: Please scan your wallet's Public Addres QR code to integrate with the GoldWallet.',
      unsupportedElectrumVaultMnemonic: 'TRANSLATION NEEDED | ENG: This seed is from Electrum Vault and is currently not supported. Will be supported in the near future.',
    },
    exportWallet: {
      title: 'Frase mnemotécnica',
      header: 'Exportar monedero',
    },
    exportWalletXpub: {
      header: 'Monedero XPUB',
    },
    deleteWallet: {
      title: 'Elimine su monedero',
      header: 'Eliminar monedero',
      description1: '¿Está seguro que quiere eliminarlo',
      description2: '? No podrá deshacer esta operación.',
      no: 'No',
      yes: 'Sí',
    },
    wallet: {
      none: 'Ninguna',
      latest: 'Última transacción',
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance',
    },
    add: {
      title: 'Añadir nuevo monedero',
      subtitle: 'Ponga un nombre a su monedero',
      description: 'Introduzca un nombre para su nuevo monedero.',
      inputLabel: 'Nombre',
      addWalletButton: 'Añadir nuevo monedero',
      importWalletButton: 'Importar monedero',
      advancedOptions: 'Opciones avanzadas',
      multipleAddresses: 'Múltiples direcciones',
      singleAddress: 'Dirección única',
      segwidAddress: 'Contiene un árbol de direcciones SegWit nativas, generadas a partir de una única semilla de 24 palabras',
      failed: 'TRANSLATION NEEDED | ENG: Failed to create wallet',
      walletType: 'TRANSLATION NEEDED | ENG: Wallet type',
      ar: 'TRANSLATION NEEDED | ENG: It can make Alert & Recovery transactions but lacks Instant transactions',
      air: 'TRANSLATION NEEDED | ENG: It can make Alert, Instant and Recovery transactions',
      legacyTitle: 'TRANSLATION NEEDED | ENG: Legacy',
      legacyHDP2SHTitle: 'TRANSLATION NEEDED | ENG: Legacy HD P2SH',
      legacyP2SHTitle: 'TRANSLATION NEEDED | ENG: Legacy P2SH',
      legacyHDSegWitTitle: 'TRANSLATION NEEDED | ENG: Legacy HD SegWit',
      legacy: 'TRANSLATION NEEDED | ENG: It can make default type of transactions',
      legacyHDP2SH: 'TRANSLATION NEEDED | ENG: It contains a tree of P2SH addresses generated from a single 24-word seed',
      LegacyP2SH: 'TRANSLATION NEEDED | ENG: It contains a single P2SH address',
      LegacyHDSegWit: 'TRANSLATION NEEDED | ENG: It contains a tree of native segwit addresses, generated from a single 24-word seed',
      publicKeyError: 'TRANSLATION NEEDED | ENG: Provided public key is invalid',
    },
    addSuccess: {
      title: 'Añadir nuevo monedero',
      subtitle: 'Completado',
      description: 'Su monedero ha sido creado. Tómese un momento para escribir esta frase mnemotécnica en una hoja de papel. Es su copia de seguridad. Puede usarlo para restaurar el monedero en otros dispositivos.',
      okButton: 'De acuerdo, ¡ya lo he escrito!',
    },
    details: {
      edit: 'Editar',
      latestTransaction: 'Última transacción',
      typeLabel: 'Tipo',
      nameLabel: 'Nombre',
      exportWallet: 'Exportar monedero',
      showWalletXPUB: 'Mostrar monedero XPUB',
      deleteWallet: 'Eliminar monedero',
      nameEdit: 'Editar nombre',
    },
    export: {
      title: 'exportar monedero',
    },
    import: {
      title: 'importar',
      explanation: 'Escriba aquí su clave mnemotécnica privada, WIF o cualquier cosa que tenga. GoldWallet hará todo lo posible para adivinar el formato correcto e importar su monedero',
      imported: 'Importado',
      error: 'Error al importar. Asegúrese de que los datos proporcionados sean válidos.',
      success: 'Completado',
      do_import: '¿Importar',
      scan_qr: 'o escanear el código QR en su lugar?',
    },
    scanQrWif: {
      go_back: 'Volver',
      cancel: 'Cancelar',
      decoding: 'Descifrando',
      input_password: 'Introduzca la contraseña',
      password_explain: 'Esta es la clave privada cifrada BIP38',
      bad_password: 'Contraseña incorrecta',
      wallet_already_exists: 'Este monedero ya existe',
      bad_wif: 'WIF incorrecto',
      imported_wif: 'WIF importado',
      with_address: 'con direccion',
      imported_segwit: 'SegWit importado',
      imported_legacy: 'Legacy importado',
      imported_watchonly: 'Versión de solo lectura importada',
    },
    publicKey: {
      recoverySubtitle: 'TRANSLATION NEEDED | ENG: Integrate Recovery Key',
      recoveryDescription: 'TRANSLATION NEEDED | ENG: Go to the Web Key Generator on a separate device and use this app to scan the Recovery Key’s generated QR code.',
      instantSubtitle: 'TRANSLATION NEEDED | ENG: Integrate Instant Key',
      instantDescription: 'TRANSLATION NEEDED | ENG: Go to the Web Key Generator on a separate device and use this app to scan the Instant Key's generated QR code.',
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
      conf: 'Confirmaciones',
    },
    details: {
      title: 'Transacción',
      detailTitle: 'Detalles de la transacción',
      transactionHex: 'Transacción en hexadecimal',
      transactionHexDescription: 'Esta es una transacción hexadecimal, firmada y lista para ser transmitida a la red',
      copyAndBoriadcast: 'Copiar y transmitir más tarde',
      verify: 'Verificar en coinb.in',
      amount: 'Cantidad',
      fee: 'Comisión',
      txSize: 'Tamaño TX',
      satoshiPerByte: 'Satoshi por byte',
      from: 'De',
      to: 'Para',
      bytes: 'bytes',
      copy: 'Copiar',
      noLabel: 'Sin etiqueta',
      details: 'Detalles',
      transactionId: 'ID de transacción',
      confirmations: 'confirmaciones',
      transactionDetails: 'Detalles de la transacción',
      viewInBlockRxplorer: 'Ver en el explorador de bloques',
      addNote: 'Añadir nota',
      note: 'Nota',
      inputs: 'Inputs',
      ouputs: 'Outputs',
      sendCoins: 'Enviar monedas',
      transactionType: 'TRANSLATION NEEDED | ENG: Transaction type',
      transactioFee: 'TRANSLATION NEEDED | ENG: Transaction fee',
      walletType: 'TRANSLATION NEEDED | ENG: Wallet type',
      addToAddressBook: 'TRANSLATION NEEDED | ENG: Add to Address book',
      timePending: 'TRANSLATION NEEDED | ENG: Time pending',
    },
    label: {
      pending: 'TRANSLATION NEEDED | ENG: pending',
      recovered: 'TRANSLATION NEEDED | ENG: recovered',
      done: 'TRANSLATION NEEDED | ENG: done',
      cancelled: 'TRANSLATION NEEDED | ENG: cancelled',
    },
    transactionTypeLabel: {
      alert: 'TRANSLATION NEEDED | ENG: Alert',
      recovery: 'TRANSLATION NEEDED | ENG: Recovery',
      instant: 'TRANSLATION NEEDED | ENG: Instant',
      nonvault: 'TRANSLATION NEEDED | ENG: Standard',
    },
  },
  send: {
    header: 'Enviar monedas',
    success: {
      title: 'Completado',
      description: '¡Bravo! Ha finalizado la transacción correctamente.',
      done: 'Hecho',
      return: 'Volver al Panel',
    },
    details: {
      title: 'crear transacción',
      amount_field_is_not_valid: 'El campo de cantidad no es válido',
      fee_field_is_not_valid: 'El campo de comisión no es válido',
      address_field_is_not_valid: 'El campo de dirección no es válido',
      create_tx_error: 'Se produjo un error al crear la transacción. Asegúrese de que la dirección sea válida.',
      address: 'dirección',
      amount_placeholder: 'cantidad a enviar (en BTCV)',
      fee_placeholder: 'más la comisión de transacción (en BTCV)',
      note_placeholder: 'nota personal',
      cancel: 'Cancelar',
      scan: 'Escanear',
      send: 'Enviar',
      next: 'Siguiente',
      note: 'Nota (opcional)',
      to: 'para',
      feeUnit: 'Sat/B',
      fee: 'Comisión:',
      create: 'Crear factura',
      remaining_balance: 'Saldo restante',
      total_exceeds_balance: 'El monto de envío excede el saldo disponible.',
    },
    confirm: {
      sendNow: 'Enviar ahora',
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance after transaction',
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance after transaction',
    },
    create: {
      amount: 'Cantidad',
      fee: 'Comisión',
      setTransactionFee: 'Establezca una comisión de transacción',
      headerText: 'Cuando hay una gran cantidad de transacciones pendientes en la red (> 1500), la tarifa más alta dará como resultado que su transacción se procese más rápido. Los valores típicos son 1-500 sat/b',
    },
    recovery: {
      recover: 'TRANSLATION NEEDED | ENG: Recover',
      useWalletAddress: 'TRANSLATION NEEDED | ENG: Use address of this wallet',
      confirmSeed: 'TRANSLATION NEEDED | ENG: Confirm with Recovery Seed',
      confirmSeedDesc: 'TRANSLATION NEEDED | ENG: Please enter your Recovery Seed in order to proceed.',
      confirmFirstSeed: 'TRANSLATION NEEDED | ENG: Confirm with first Recovery Seed',
      confirmFirstSeedDesc: 'TRANSLATION NEEDED | ENG: Please enter your first Recovery Seed in order to proceed.',
      confirmSecondSeed: 'TRANSLATION NEEDED | ENG: Confirm with second Recovery Seed',
      confirmSecondSeedDesc: 'TRANSLATION NEEDED | ENG: Please enter your second Recovery Seed in order to proceed.',
    },
    transaction: {
      instant: 'TRANSLATION NEEDED | ENG: Instant',
      instantDesc: 'TRANSLATION NEEDED | ENG: This method allows you to send immediate transfers. Use with extreme caution.',
      alert: 'TRANSLATION NEEDED | ENG: Alert',
      alertDesc: 'TRANSLATION NEEDED | ENG: This transaction waits 144 blocks or ca. 24 hours to be confirmed. Within this time you can recover your coins.',
      type: 'TRANSLATION NEEDED | ENG: Transaction type',
      scanInstantKeyTitle: 'TRANSLATION NEEDED | ENG: Scan Instant Key',
      scanInstantKeyDesc: 'TRANSLATION NEEDED | ENG: Scan the Instant Key QR code to start the transaction.',
      lightningError: 'TRANSLATION NEEDED | ENG: This address appears to be for a Lightning invoice. Please, go to your Lightning wallet in order to make a payment for this invoice.',
      watchOnlyError: 'TRANSLATION NEEDED | ENG: Watch only wallets cannot send transactions',
    },
  },
  receive: {
    header: 'Recibir monedas',
    details: {
      amount: 'Cantidad',
      share: 'Compartir',
      receiveWithAmount: 'Recibir con cantidad',
    },
  },
  settings: {
    language: 'Idioma',
    general: 'General',
    security: 'Seguridad',
    about: 'Acerca de',
    electrumServer: 'Servidor Electrum',
    advancedOptions: 'Opciones avanzadas',
    changePin: 'Cambiar PIN',
    fingerprintLogin: 'Inicio de sesión con huella digital',
    aboutUs: 'Sobre nosotros',
    header: 'Configuración',
    notSupportedFingerPrint: 'Su dispositivo no admite huellas digitales',
    TouchID: 'Permitir huella digital',
    FaceID: 'Permitir FaceID',
    Biometrics: 'Permitir biometría',
  },
  aboutUs: {
    header: 'Sobre nosotros',
    releaseNotes: 'Notas de la versión',
    runSelfTest: 'Ejecutar autocomprobación',
    buildWithAwesome: 'Construido con genialidad:',
    rateGoldWallet: 'Valorar GoldWallet',
    goToOurGithub: 'Acceda a nuestro Github',
    alwaysBackupYourKeys: 'Siempre guarde una copia de seguridad de sus claves',
    title: 'Gold Wallet es un monedero de Bitcoin Vault gratuito y de código abierto. Con licencia MIT.',
  },
  electrumServer: {
    header: 'Servidor Electrum',
    title: 'Cambiar servidor electrum',
    description: 'Puede cambiar la dirección del servidor al que se conectará su aplicación. Se recomienda la dirección por defecto.',
    save: 'Guardar',
    useDefault: 'Usar predeterminado',
    host: 'host',
    port: 'puerto',
    successfullSave: 'Sus cambios se han guardado correctamente. Puede ser necesario reiniciar para que los cambios surtan efecto.',
    connectionError: 'No se puede conectar al servidor Electrum proporcionado',
  },
  advancedOptions: {
    title: 'Configurar opciones avanzadas',
    description: 'Al activar las opciones avanzadas, podrá elegir entre los tipos de cartera enumerados a continuación: \nP2SH, HD P2SH, HD segwit.',
  },
  selectLanguage: {
    header: 'Idioma',
    restartInfo: 'Al seleccionar un nuevo idioma, puede ser necesario reiniciar GoldWallet para que el cambio surta efecto',
    confirmation: 'Confirmación',
    confirm: 'Confirmar',
    alertDescription: '¿Seleccionar idioma y reiniciar la aplicación?',
    cancel: 'Cancelar',
  },
  contactList: {
    cancel: 'Cancelar',
    search: 'Buscar',
    screenTitle: 'Libreta de direcciones',
    noContacts: 'No hay contactos',
    noContactsDesc1: 'No hay contactos para mostrar.\nHaga clic',
    noContactsDesc2: 'para añadir su primer contacto.',
    noResults: 'No hay resultados para',
  },
  contactCreate: {
    screenTitle: 'Añadir nuevo contacto',
    subtitle: 'Nuevo contacto',
    description: 'Escriba nombre y dirección\npara su nuevo contacto.',
    nameLabel: 'Nombre',
    addressLabel: 'Dirección',
    buttonLabel: 'Añadir nuevo contacto',
    successTitle: 'Completado',
    successDescription: '¡Bravo! Ha añadido su contacto correctamente.',
    successButton: 'Volver a la libreta de direcciones',
  },
  contactDetails: {
    nameLabel: 'Nombre',
    addressLabel: 'Dirección',
    editName: 'Editar nombre',
    editAddress: 'Editar dirección',
    sendCoinsButton: 'Enviar monedas',
    showQRCodeButton: 'Mostrar código QR',
    deleteButton: 'Borrar contacto',
    share: 'Compartir',
  },
  contactDelete: {
    title: 'Eliminar su contacto',
    header: 'Borrar contacto',
    description1: '¿Está seguro que quiere eliminarlo',
    description2: '?\nNo podrá deshacer esta operación.',
    no: 'No',
    yes: 'Sí',
    success: 'Completado',
    successDescription: 'Su contacto ha sido eliminado correctamente.\nAhora puede volver a la libreta de direcciones.',
    successButton: 'Volver a la libreta de direcciones',
  },
  scanQrCode: {
    permissionTitle: 'Permiso para usar la cámara',
    permissionMessage: 'Necesitamos su permiso para usar su cámara',
    ok: 'Aceptar',
    cancel: 'Cancelar',
  },
  filterTransactions: {
    header: 'filtrar transacciones',
    receive: 'recibir',
    send: 'enviar',
    filter: 'filtrar',
    to: 'para',
    toAmount: 'monto máximo',
    toDate: 'fecha de finalización',
    from: 'de',
    fromAmount: 'monto mínimo',
    fromDate: 'fecha de inicio',
    clearFilters: 'borrar filtros',
    transactionType: 'TRANSLATION NEEDED | ENG: Transaction type',
    transactionStatus: 'TRANSLATION NEEDED | ENG: Transaction status',
    status: {
      pending: 'TRANSLATION NEEDED | ENG: Pending',
      recovered: 'TRANSLATION NEEDED | ENG: Recovered',
      done: 'TRANSLATION NEEDED | ENG: Done',
      cancelled: 'TRANSLATION NEEDED | ENG: Cancelled',
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
      descPin: 'TRANSLATION NEEDED | ENG: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
      descPublicKey: 'TRANSLATION NEEDED | ENG: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    },
    import: {
      title: 'TRANSLATION NEEDED | ENG: Import authenticator',
      success: 'TRANSLATION NEEDED | ENG: Your authenticator has been successfully imported. You can now return to Authenticators.',
      subtitle: 'TRANSLATION NEEDED | ENG: Import your authenticator',
      desc1: 'TRANSLATION NEEDED | ENG: Please write your mnemonic in order to import your authenticator',
      desc2: 'TRANSLATION NEEDED | ENG: scan QR code by clicking on “or scan QR code” below',
      textAreaPlaceholder: 'TRANSLATION NEEDED | ENG: Mnemonic',
    },
    export: {
      title: 'TRANSLATION NEEDED | ENG: Export authenticator',
    },
    delete: {
      title: 'TRANSLATION NEEDED | ENG: Delete authenticator',
      subtitle: 'TRANSLATION NEEDED | ENG: Delete your authenticator',
      success: 'TRANSLATION NEEDED | ENG: Your authenticator has been successfully deleted. You can now return to Authenticators.',
    },
    list: {
      noAuthenticatorsDesc1: 'TRANSLATION NEEDED | ENG: No authenticators to show. \n Tap',
      noAuthenticatorsDesc2: 'TRANSLATION NEEDED | ENG: to add your first authenticator.',
      noAuthenticators: 'TRANSLATION NEEDED | ENG: No Authenticators',
      scan: 'TRANSLATION NEEDED | ENG: Scan',
      title: 'TRANSLATION NEEDED | ENG: Bitcoin Vault authenticators',
    },
    add: {
      title: 'TRANSLATION NEEDED | ENG: Add new authenticator',
      subtitle: 'TRANSLATION NEEDED | ENG: Pair authenticator',
      successDescription: 'TRANSLATION NEEDED | ENG: Your authenticator has been created. Please take a moment to write down this mnemonic phrase on a piece of paper. It’s your backup. You can use it to restore this authenticator on other devices. The authenticator allows you to confirm Instant and Recovery transactions.',
      description: 'TRANSLATION NEEDED | ENG: Select the option to “create wallet” on Electrum Vault (desktop application). Follow the steps until you see a QR code. Scan it using “Scan” button below to continue',
      subdescription: 'TRANSLATION NEEDED | ENG: import you authenticator by clicking on Import authenticator” below.',
    },
    enterPIN: {
      subtitle: 'TRANSLATION NEEDED | ENG: Enter PIN',
      description: 'TRANSLATION NEEDED | ENG: Please enter the following PIN into the Electrum Vault (desktop application).',
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
