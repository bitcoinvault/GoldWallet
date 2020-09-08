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
    or: 'o',
    delete: 'Eliminar',
    created: 'Creado el',
    invalid: 'No válido',
    satoshi: 'Satoshi',
    next: 'Siguiente',
  },
  tabNavigator: {
    dashboard: 'Panel',
    settings: 'Configuración',
    addressBook: 'Libreta de direcciones',
    wallets: 'Monederos',
    authenticators: 'Autenticadores',
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
    allDone: '¡Todo listo!',
    hooray: '¡Hurra!',
    cancelTxSuccess: 'Ha cancelado la transacción correctamente.\nSus monedas están de camino.',
    wrongMnemonic: 'Frase mnemotécnica incorrecta',
    wrongMnemonicDesc: 'Su frase mnemotécnica no coincide con ningún monedero compatible. Está intentado importar una frase mnemotécnica no válida o un monedero que no se ha usado nunca.',
    returnToWalletChoose: 'Volver a selección del tipo de monedero',
    returnToWalletImport: 'Volver a importar el monedero',
    generateAddressesError: 'No se ha podido generar la dirección',
    noTransactions: 'No se ha encontrado ninguna transacción en el monedero',
    noTransactionsDesc: 'Es probable que esté intentando importar un monedero que nunca se ha usado',
    returnToAuthenticators: 'Volver a Autenticadores',
    creatingAuthenticator: 'Creando su autenticador',
    creatingAuthenticatorDescription: 'Tenga paciencia mientras se crea su autenticador.\n Puede tardar un poco.',
    importingAuthenticator: 'Importando tus autentificadores',
    importingAuthenticatorDescription: 'Tenga paciencia mientras importamos su autenticador.\n Puede tardar un poco.',
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
    successDescription: '¡Bravo! \n  Ha creado con éxito su PIN.',
    successDescriptionChangedPin: '¡Bravo! \n  Ha cambiado con éxito su PIN.',
    successButton: 'Ir al Panel',
    successButtonChangedPin: 'Volver a Configuración',
    failedTimes: 'Veces que ha fallado',
    failedTimesErrorInfo: 'Después de tres intentos sin éxito, se bloqueará el acceso para',
    goBack: 'Volver',
    minutes: 'minutos.',
    numberOfAttemptsExceeded: 'Se ha excedido el número de intentos',
    seconds: 'segundos',
    tryAgain: 'Vuelva intentarlo luego de',
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
      availableBalance: 'Balance disponible',
      wallet: 'monedero',
      recover: 'Cancelar',
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
      chooseTypeDescription: 'Seleccione el tipo de monedero que desea importar',
      importARDescription1: 'Introduzca la frase mnemotécnica',
      importARDescription2: 'Escanee el código QR del monedero que desea importar',
      scanWalletAddress: 'Escanee la dirección del monedero',
      scanWalletAddressDescription: 'Escanee el código QR de la dirección pública para iniciar la integración con GoldWallet.',
      scanFastPubKey: 'Escanee el código QR de la Clave Rápida',
      scanCancelPubKey: 'Escanee el código QR de la clave de Cancelación',
      scanPublicKeyDescription: 'Abra el primer documento PDF que generó cuando creó el monedero que desea importar y use esta aplicación para escanear el código QR de la clave pública.',
      unsupportedElectrumVaultMnemonic: 'Esta frase mnemotécnica es de Electrum Vault y actualmente no es compatible. Será compatible próximamente.',
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
      description1: '¿Está seguro de que quiere eliminarlo',
      description2: '? No podrá deshacer esta operación.',
      no: 'No',
      yes: 'Sí',
    },
    wallet: {
      none: 'Ninguna',
      latest: 'Última transacción',
      pendingBalance: 'Balance pendiente',
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
      failed: 'No se ha podido crear el monedero',
      walletType: 'Tipo de monedero',
      ar: 'Realiza transacciones estándar y de cancelación.',
      air: 'Realiza transacciones estándar, de cancelación y rápidas.',
      legacyTitle: 'Legacy',
      legacyHDP2SHTitle: 'Legacy HD P2SH',
      legacyP2SHTitle: 'Legacy P2SH',
      legacyHDSegWitTitle: 'LegacyHD SegWit',
      legacy: 'Realiza tipos de transacciones predeterminadas.',
      legacyHDP2SH: 'Contiene un árbol de direcciones P2SH generado de una semilla única de 24 palabras',
      LegacyP2SH: 'Contiene una única dirección P2SH',
      LegacyHDSegWit: 'Contiene un árbol de direcciones de segwit nativas, generadas a partir de una semilla única de 24 palabras',
      publicKeyError: 'La clave pública proporcionada no es válida',
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
      with_address: 'con dirección',
      imported_segwit: 'SegWit importado',
      imported_legacy: 'Legacy importado',
      imported_watchonly: 'Versión de solo lectura importada',
    },
    publicKey: {
      recoverySubtitle: 'Agregar Clave de Cancelación',
      webKeyGenerator: 'Generador de claves web:',
      recoveryDescription: 'Vaya al Generador de Claves web en un dispositivo diferente y use esta aplicación para escanear el código QR público. ¡Recuerde exportar sus claves como PDF!',
      instantSubtitle: 'Agregar Clave Rápida',
      instantDescription: 'Vaya al Generador de Claves web en un dispositivo diferente y use esta aplicación para escanear el código QR público. ¡Recuerde exportar sus claves como PDF!',
      scan: 'Escanear',
    },
    errors: {
      invalidMnemonicWordsNumber: 'Palabras proporcionadas {receivedWordsNumber} esperadas {expectedWordsNumber}',
      noIndexForWord: 'No se ha podido encontrar el índice por palabra: {word}',
      invalidPrivateKey: 'Clave privada no válida',
      invalidPublicKey: 'Clave pública no válida',
      invalidMnemonic: 'Frase mnemotécnica no válida',
      invalidQrCode: 'Código QR no válido',
      invalidSign: 'No se ha podido firmar la transacción',
      duplicatedPublicKey: 'Ya se ha agregado la clave pública',
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
      transactionType: 'Tipo de transacción',
      transactioFee: 'Tarifa de transacción',
      walletType: 'Tipo de monedero',
      addToAddressBook: 'Agregar a la libreta de direcciones',
      timePending: 'Tiempo restante',
    },
    label: {
      pending: 'pendiente',
      annulled: 'anulada',
      done: 'finalizada',
      canceled: 'cancelada',
      unblocked: 'TRANSLATION NEEDED | ENG: unblocked',
    },
    transactionTypeLabel: {
      standard: 'Estándar',
      canceled: 'Cancelación',
      fast: 'Rápida',
      secure: 'TRANSLATION NEEDED | ENG: Secure',
      secureFast: 'TRANSLATION NEEDED | ENG: Secure Fast',
    },
    errors: {
      notEnoughBalance: 'TRANSLATION NEEDED | ENG: Not enough balance. Please, try sending a smaller amount.',
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
      cancelNow: 'Cancelar ahora',
      availableBalance: 'Balance disponible después de la transacción',
      pendingBalance: 'Balance pendiente después de la transacción',
    },
    create: {
      amount: 'Cantidad',
      fee: 'Comisión',
      setTransactionFee: 'Establezca una comisión de transacción',
      headerText: 'Cuando hay una gran cantidad de transacciones pendientes en la red (> 1500), la tarifa más alta dará como resultado que su transacción se procese más rápido. Los valores típicos son 1-500 sat/b',
    },
    recovery: {
      recover: 'Cancelar',
      useWalletAddress: 'Usar la dirección de este monedero',
      confirmSeed: 'Confirmar con Cancelar Frase Mnemotécnica',
      confirmSeedDesc: 'Abra el documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden.',
      confirmFirstSeed: 'Confirmar con Cancelar Frase Mnemotécnica',
      confirmFirstSeedDesc: 'Abra el primer documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden',
      confirmSecondSeed: 'Confirmar con Frase Mnemotécnica Rápida',
      confirmSecondSeedDesc: 'Abre el segundo documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden.',
    },
    transaction: {
      instant: 'Rápida',
      instantDesc: 'Esta transacción será confirmada inmediatamente. Úsela con extrema precaución.',
      fastSuccess: 'Su transacción rápida se ha realizado correctamente.',
      alert: 'Estándar',
      alertDesc: 'Esta transacción necesita 144 bloques o unas 24 horas para confirmarse. Puede cancelarla durante este tiempo.',
      type: 'Tipo de transacción',
      scanInstantKeyTitle: 'Escanee la Clave Rápida',
      scanInstantKeyDesc: 'Abra el documento PDF que generó al crear su monedero y escanee el código QR de la clave privada para enviar la transacción.',
      lightningError: 'Esta dirección aparece para la factura de Lightning. Vaya a su monedero de Lightning para poder realizar el pago de esta factura.',
      watchOnlyError: 'Los monederos de solo lectura no pueden enviar transacciones',
    },
    error: {
      title: 'Error',
      description: 'Antes de crear una transacción, primero debe agregar un monedero de Bitcoin Vault.',
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
    description: 'Al activar las opciones avanzadas, podrá elegir entre los tipos de cartera enumerados a continuación: \n P2SH, HD P2SH, HD segwit.',
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
    noContactsDesc1: 'No hay contactos para mostrar.\n Haga clic',
    noContactsDesc2: 'para añadir su primer contacto.',
    noResults: 'No hay resultados para',
  },
  contactCreate: {
    screenTitle: 'Añadir nuevo contacto',
    subtitle: 'Nuevo contacto',
    description: 'Escriba nombre y dirección\n para su nuevo contacto.',
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
    description1: '¿Está seguro de que quiere eliminarlo',
    description2: '?\n No podrá deshacer esta operación.',
    no: 'No',
    yes: 'Sí',
    success: 'Completado',
    successDescription: 'Su contacto ha sido eliminado correctamente.\n Ahora puede volver a la libreta de direcciones.',
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
    received: 'Recibida',
    sent: 'Enviada',
    transactionType: 'Tipo de transacción',
    transactionStatus: 'Estado de la transacción',
    status: {
      pending: 'Pendiente',
      annulled: 'Anulada',
      done: 'Finalizada',
      canceled: 'Cancelada',
      unblocked: 'TRANSLATION NEEDED | ENG: Unblocked',
    },
  },
  authenticators: {
    sign: {
      error: 'Ninguno de los autenticadores pudo firmar la transacción',
    },
    options: {
      title: 'Opciones de autenticador',
      export: 'Exportar autenticador',
      pair: 'Emparejar autenticador',
      sectionTitle: 'General',
      delete: 'Eliminar autenticador',
    },
    pair: {
      title: 'Emparejar autenticador',
      pin: 'PIN',
      publicKey: 'Clave púbica',
      descPin: 'Use este PIN para confirmar el emparejamiento del autenticador en su aplicación de escritorio.',
      descPublicKey: 'Puede usar esta clave pública para importar su autenticador en la aplicación de escritorio durante el proceso de creación del monedero con la opción de GoldWallet.',
    },
    import: {
      title: 'Importar autenticador',
      success: 'Ha importado su autenticador correctamente. Ya está listo para usarse.',
      subtitle: 'Importe su autenticador',
      desc1: 'Escriba la frase mnemotécnica o escanee el código QR del autenticador que desea importar.',
      desc2: 'escanee el código QR al hacer clic en \"o escanee el código QR\" debajo',
      textAreaPlaceholder: 'Frase mnemotécnica',
    },
    export: {
      title: 'Exportar autenticador',
    },
    delete: {
      title: 'Eliminar autenticador',
      subtitle: 'Elimine su autenticador',
      success: 'Se ha eliminado su autenticador correctamente. Puede crear uno nuevo en cualquier momento.',
    },
    list: {
      noAuthenticatorsDesc1: 'Presione',
      noAuthenticatorsDesc2: 'para agregar su primer autenticador.',
      noAuthenticators: 'Aún no hay autenticadores',
      scan: 'Escanear',
      title: 'Autenticadores de Bitcoin Vault',
    },
    add: {
      successTitle: '¡Su autenticador está listo!',
      title: 'Agregar un autenticador nuevo',
      subtitle: 'Emparejar autenticador',
      successDescription: 'Escriba esta frase mnemotécnica en un lugar seguro. Es su copia de seguridad en caso de que necesite recuperar su autenticador. Recuerde que se necesita el autenticador para confirmar transacciones rápidas y de cancelación.',
      description: 'Abra su aplicación de escritorio de Electrum Vault y cree un nuevo monedero. Siga los pasos en la pantalla hasta que vea un código QR. Use esta aplicación para escanearlo y continuar.',
      subdescription: 'También puede importar su autenticador al escoger la siguiente opción.',
    },
    enterPIN: {
      subtitle: 'Introduzca el PIN',
      description: 'Introduzca este Pin en la aplicación de escritorio de Electrum Vault para terminar el proceso de emparejamiento.',
    },
  },
  timeCounter: {
    title: 'Aplicación bloqueada',
    description: 'Se ha bloqueado su aplicación debido a los intentos de iniciar sesión sin éxito. Espere el tiempo necesario para poder volver a intentarlo.',
    tryAgain: 'Volver a intentarlo',
    closeTheApp: 'Cerrar la aplicación',
  },
  security: {
    jailBrokenPhone: 'Su dispositivo parece estar liberado. Esto puede producir riesgos de seguridad, errores u otros problemas. No recomendamos usar GoldWallet con un dispositivo liberado.',
    rootedPhone: 'Su dispositivo parece estar enraizado. Esto puede riesgos de seguridad, errores u otros problemas. No recomendamos usar GoldWallet con un dispositivo enraizado.',
    title: 'Problema de seguridad',
  },
}
