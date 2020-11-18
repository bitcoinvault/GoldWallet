module.exports = {
  _: {
    bad_password: 'Contraseña incorrecta, inténtelo nuevamente',
    cancel: 'Cancelar',
    click: 'Haga click',
    confirm: 'Confirmar',
    continue: 'Continuar',
    copied: '¡Copiado!',
    copy: 'Copiar',
    created: 'Creado el',
    delete: 'Eliminar',
    enter_password: 'Escribir contraseña',
    here: 'aquí',
    invalid: 'No válido',
    languageCode: 'es',
    never: 'nunca',
    next: 'Siguiente',
    ok: 'Aceptar',
    or: 'o',
    satoshi: 'Satoshi',
    save: 'Guardar',
    scan: 'Escanear',
    storage_is_encrypted: 'Su almacenamiento está cifrado. Se requiere contraseña para descifrarlo',
  },
  termsConditions: {
    header: 'Términos y Condiciones',
    title: 'Acuerdo de los Términos',
    text: '',
    buttons: {
      agree: 'Estoy de acuerdo',
      disagree: 'No estoy de acuerdo',
    },
    modal: {
      header: '¿Está seguro?',
      text:
        'Tenga en cuenta que si no está de acuerdo con nuestros Términos y Condiciones, no podrá utilizar la aplicación Gold Wallet.¿Está seguro de que no está de acuerdo?',
      noButton: 'No, cambié de opinión.',
      yesButton: 'Sí, no estoy de acuerdo.',
    },
  },
  aboutUs: {
    alwaysBackupYourKeys: 'Siempre guarde una copia de seguridad de sus claves',
    buildWithAwesome: 'Construido con genialidad:',
    goToOurGithub: 'Acceda a nuestro Github',
    header: 'Sobre nosotros',
    rateGoldWallet: 'Valorar GoldWallet',
    releaseNotes: 'Notas de la versión',
    runSelfTest: 'Ejecutar autocomprobación',
    title: 'Gold Wallet es un monedero de Bitcoin Vault gratuito y de código abierto. Con licencia MIT.',
  },
  advancedOptions: {
    description:
      'Al activar las opciones avanzadas, podrá elegir entre los tipos de monedero enumerados a continuación: \n  P2SH, HD P2SH, HD segwit.',
    title: 'Configurar opciones avanzadas',
  },
  authenticators: {
    add: {
      description:
        'Tendrá que emaprejar Gold Wallet con la aplicación de escritorio Electrum Vault. Servirá como autenticación de dos factores.',
      subdescription: 'También puede importar su autenticador al escoger la siguiente opción.',
      subtitle: 'Crear un nuevo autenticador',
      successDescription:
        'Escriba esta frase mnemotécnica en un lugar seguro. Es su copia de seguridad en caso de que necesite recuperar su autenticador. Recuerde que se necesita el autenticador para confirmar transacciones rápidas y de cancelación.',
      successTitle: '¡Su autenticador está listo!',
      title: 'Agregar un autenticador nuevo',
    },
    delete: {
      subtitle: 'Elimine su autenticador',
      success: 'Se ha eliminado su autenticador correctamente. Puede crear uno nuevo en cualquier momento.',
      title: 'Eliminar autenticador',
    },
    enterPIN: {
      description:
        'Introduzca este PIN en la aplicación de escritorio Electrum Vault para terminar el proceso de emparejamiento.',
      subtitle: 'Introduzca el PIN',
    },
    errors: {
      noEmpty: 'El campo no puede estar vacío',
    },
    export: {
      title: 'Exportar autenticador',
    },
    import: {
      code: 'Código:',
      desc1: 'Escriba la frase mnemotécnica o escanee el código QR del autenticador que desea importar.',
      desc2: 'escanee el código QR al hacer clic en "o escanee el código QR" debajo',
      inUseValidationError: 'El nombre debe ser único. Por favor, introduzca un nombre válido.',
      mnemonicLength: 'La mnemotecnia debe tener 12 palabras',
      multipleQrCodesDescription:
        'Algunas transacciones generan múltiples códigos QR. Asegúrese de escanearlos todos desde la aplicación Electrum Vault.',
      multipleQrCodesTitle: 'Escanee otro código QR',
      scanNext: 'Escanee el siguiente',
      subtitle: 'Importe su autenticador',
      success: 'Ha importado su autenticador correctamente. Ya está listo para usarse.',
      textAreaPlaceholder: 'Frase mnemotécnica',
      title: 'Importar autenticador',
    },
    list: {
      noAuthenticators: 'Aún no hay autenticadores',
      noAuthenticatorsDesc1: 'Presione',
      noAuthenticatorsDesc2: 'para agregar su primer autenticador.',
      scan: 'Escanear',
      title: 'Autenticadores de Bitcoin Vault',
    },
    options: {
      delete: 'Eliminar autenticador',
      export: 'Exportar autenticador',
      pair: 'Emparejar autenticador',
      sectionTitle: 'General',
      title: 'Opciones de autenticador',
    },
    pair: {
      descPin: 'Use este PIN para confirmar el emparejamiento del autenticador en su aplicación de escritorio.',
      descPublicKey:
        'Puede usar esta clave pública para importar su autenticador en la aplicación de escritorio durante el proceso de creación del monedero con la opción de GoldWallet.',
      pin: 'PIN',
      publicKey: 'Clave púbica',
      title: 'Emparejar autenticador',
    },
    publicKey: {
      okButton: 'Bien, entendido.',
      subtitle:
        'Puede usar esta Clave Pública para importar su autentificador a la aplicación de escritorio Electrum Vault durante la creación del monedero de 2FA.',
      title: 'Clave Pública',
    },
    sign: {
      error: 'Ninguno de los autenticadores pudo firmar la transacción',
    },
  },
  betaVersion: {
    button: 'Acepto el riesgo',
    description:
      'Aún está en fase de pruebas finales antes de su lanzamiento oficial. La aplicación móvil y todo el contenido que se encuentra en ella se proporciona "tal como está" y según "esté disponible". El uso del programa se realiza por cuenta y riesgo del usuario.',
    title: 'Es versión beta de GoldWallet',
  },
  contactCreate: {
    addressLabel: 'Dirección',
    buttonLabel: 'Añadir nuevo contacto',
    description: 'Escriba nombre y dirección\n  para su nuevo contacto.',
    nameCannotContainSpecialCharactersError: 'El nombre no puede contener caracteres especiales.',
    nameLabel: 'Nombre',
    nameMissingAlphanumericCharacterError: 'Falta el carácter alfanumérico del nombre.',
    screenTitle: 'Añadir nuevo contacto',
    subtitle: 'Nuevo contacto',
    successButton: 'Volver a la libreta de direcciones',
    successDescription: '¡Bravo! Ha añadido su contacto correctamente.',
    successTitle: 'Completado',
  },
  contactDelete: {
    description1: '¿Está seguro de que quiere eliminar',
    description2: '?\n  No podrá deshacer esta operación.',
    header: 'Borrar contacto',
    no: 'No',
    success: 'Completado',
    successButton: 'Volver a la libreta de direcciones',
    successDescription:
      'Su contacto ha sido eliminado correctamente.\n  Ahora puede volver a la libreta de direcciones.',
    title: 'Eliminar su contacto',
    yes: 'Sí',
  },
  contactDetails: {
    addressLabel: 'Dirección',
    deleteButton: 'Borrar contacto',
    editAddress: 'Editar dirección',
    editName: 'Editar nombre',
    nameLabel: 'Nombre',
    sendCoinsButton: 'Enviar monedas',
    share: 'Compartir',
    showQRCodeButton: 'Mostrar código QR',
  },
  contactList: {
    cancel: 'Cancelar',
    noContacts: 'No hay contactos',
    noContactsDesc1: 'No hay contactos para mostrar.\n  Haga clic',
    noContactsDesc2: 'para añadir su primer contacto.',
    noResults: 'No hay resultados para',
    screenTitle: 'Libreta de direcciones',
    search: 'Buscar',
  },
  electrumServer: {
    connectionError: 'No se puede conectar al servidor Electrum proporcionado',
    description:
      'Puede cambiar la dirección del servidor al que se conectará su aplicación. Se recomienda la dirección predeterminada.',
    header: 'Servidor Electrum',
    host: 'host',
    port: 'puerto',
    save: 'Guardar',
    successfullSave:
      'Sus cambios se han guardado correctamente. Puede ser necesario reiniciar para que los cambios surtan efecto.',
    title: 'Cambiar servidor electrum',
    useDefault: 'Usar predeterminado',
  },
  filterTransactions: {
    clearAll: 'Borrar todo',
    clearFilters: 'borrar filtros',
    filter: 'filtrar',
    from: 'de',
    fromAmount: 'monto mínimo',
    fromDate: 'fecha de inicio',
    header: 'filtrar transacciones',
    receive: 'recibir',
    received: 'Recibida',
    send: 'enviar',
    sent: 'Enviada',
    status: {
      canceled: 'Cancelada',
      canceledDone: 'Cancelada-hecha',
      done: 'Finalizada',
      pending: 'Pendiente',
    },
    to: 'para',
    toAmount: 'monto máximo',
    toDate: 'fecha de finalización',
    transactionStatus: 'Estado de la transacción',
    transactionType: 'Tipo de transacción',
  },
  message: {
    allDone: '¡Todo listo!',
    bePatient: 'Tenga paciencia. Puede tardar un momento.',
    cancelTxSuccess: 'Ha cancelado la transacción correctamente.\nSus monedas están de camino.',
    creatingAuthenticator: 'Creando su autenticador',
    creatingAuthenticatorDescription: 'Tenga paciencia mientras se crea su autenticador.\nPuede tardar un momento.',
    creatingWallet: 'Creando su monedero',
    creatingWalletDescription: 'Tenga paciencia mientras se crea su monedero. Puede tardar un momento.',
    generateAddressesError: 'No se ha podido generar la dirección',
    hooray: '¡Hurra!',
    importingAuthenticator: 'Importando su autentificador',
    importingAuthenticatorDescription:
      'Tenga paciencia mientras se importa su autenticador.\n Puede tardar un momento.',
    noTransactions: 'No se ha encontrado ninguna transacción en el monedero',
    noTransactionsDesc: 'Es probable que esté intentando importar un monedero que nunca se ha usado',
    processing: 'Procesando',
    returnToAuthenticators: 'Volver a Autenticadores',
    returnToDashboard: 'Volver al Panel',
    returnToWalletChoose: 'Volver a selección del tipo de monedero',
    returnToWalletImport: 'Volver a importar el monedero',
    somethingWentWrong: 'Algo salió mal',
    somethingWentWrongWhileCreatingWallet:
      'Algo salió mal mientras estábamos creando su monedero. Vuelva al Panel e inténtelo nuevamente.',
    success: 'Completado',
    successfullWalletDelete: 'Su monedero ha sido eliminado correctamente. Ahora puede volver al Panel.',
    successfullWalletImport: 'Su monedero ha sido importado correctamente. Está listo para ser usado.',
    wrongMnemonic: 'Frase mnemotécnica incorrecta',
    wrongMnemonicDesc:
      'Su frase mnemotécnica no coincide con ningún monedero compatible. Está intentado importar una frase mnemotécnica no válida o un monedero que nunca se ha usado.',
  },
  onboarding: {
    changePin: 'Cambiar PIN',
    confirmNewPin: 'Confirmar nuevo PIN',
    confirmPassword: 'Confirmar contraseña de transacción',
    confirmPin: 'Confirmar PIN',
    createNewPin: 'Nuevo PIN',
    createPassword: 'Crear contraseña de transacción',
    createPasswordDescription:
      'Su contraseña de transacción se utilizará para verificar todas las transacciones. No podrá cambiarla más tarde. La contraseña de transacción debe contener al menos 8 caracteres alfanuméricos.',
    createPin: 'Crear PIN',
    createPinDescription:
      'Su PIN se utilizará para acceder a la aplicación. Puede cambiarlo más tarde en la sección de Configuración.',
    currentPin: 'PIN actual',
    failedTimes: 'Intentos fallidos',
    failedTimesErrorInfo: 'Después de tres intentos sin éxito, se bloqueará el acceso para',
    goBack: 'Volver',
    minutes: 'minutos.',
    numberOfAttemptsExceeded: 'Se ha excedido el número de intentos',
    onboarding: 'Configuración inicial',
    passwordDoesNotMatch: 'La contraseña no coincide. Por favor, introduzca una contraseña válida.',
    pin: 'PIN',
    pinDoesNotMatch: 'El PIN no coincide. Por favor, introduzca un PIN válido.',
    seconds: 'segundos',
    successButton: 'Ir al Panel',
    successButtonChangedPin: 'Volver a Configuración',
    successDescription: '¡Bravo! \n Ha creado con éxito su PIN.',
    successDescriptionChangedPin: '¡Bravo! \nHa cambiado con éxito su PIN.',
    tryAgain: 'Vuelva a intentarlo después de',
  },
  receive: {
    details: {
      amount: 'Monto',
      receiveWithAmount: 'Recibir un monto de',
      receiveWithAmountSubtitle:
        'Introduzca el monto que desea recibir. El código QR se actualizará en consecuencia para incluir ese monto.',
      share: 'Compartir',
      shareWalletAddress: 'Compartir la dirección del monedero',
    },
    header: 'Recibir monedas',
    label: 'Dirección del monedero',
  },
  scanQrCode: {
    cancel: 'Cancelar',
    ok: 'Aceptar',
    permissionMessage: 'Necesitamos su permiso para usar su cámara',
    permissionTitle: 'Permiso para usar la cámara',
  },
  security: {
    jailBrokenPhone:
      'Su dispositivo parece estar desbloqueado. Esto puede producir riesgos de seguridad, errores u otros problemas. No recomendamos usar GoldWallet en un dispositivo desbloqueado.',
    noPinOrFingerprintSet:
      'Parece que su dispositivo no tiene PIN o huella dactilar configurada. No recomendamos usar el Monedero de Oro en un dispositivo no asegurado.',
    rootedPhone:
      'Su dispositivo parece estar enraizado. Esto puede riesgos de seguridad, errores u otros problemas. No recomendamos usar GoldWallet con un dispositivo enraizado.',
    title: 'Problema de seguridad',
  },
  selectLanguage: {
    alertDescription: '¿Seleccionar idioma y reiniciar la aplicación?',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    confirmation: 'Confirmación',
    header: 'Idioma',
    restartInfo:
      'Al seleccionar un nuevo idioma, puede ser necesario reiniciar GoldWallet para que el cambio surta efecto',
  },
  send: {
    confirm: {
      availableBalance: 'Saldo disponible después de la transacción',
      cancelNow: 'Cancelar ahora',
      pendingBalance: 'Saldo bloqueado después de la transacción',
      sendNow: 'Enviar ahora',
    },
    create: {
      amount: 'Monto',
      fee: 'Comisión',
      headerText:
        'Cuando hay una gran cantidad de transacciones pendientes en la red (> 1500), la tarifa más alta hará que su transacción se procese más rápido. Los valores típicos son de 1-500 sat/b',
      setTransactionFee: 'Establezca una comisión de transacción',
    },
    details: {
      address: 'dirección',
      address_field_is_not_valid: 'El campo de dirección no es válido',
      amount_field_is_not_valid: 'El campo de monto no es válido',
      amount_placeholder: 'monto a enviar (en BTCV)',
      cancel: 'Cancelar',
      create: 'Crear factura',
      create_tx_error: 'Se produjo un error al crear la transacción. Asegúrese de que la dirección es válida.',
      fee: 'Comisión:',
      fee_field_is_not_valid: 'El campo de comisión no es válido',
      fee_placeholder: 'más la comisión de transacción (en BTCV)',
      feeUnit: 'Sat/B',
      next: 'Siguiente',
      note: 'Nota (opcional)',
      note_placeholder: 'nota personal',
      remaining_balance: 'Saldo restante',
      scan: 'Escanear',
      send: 'Enviar',
      title: 'crear transacción',
      to: 'para',
      total_exceeds_balance: 'El monto de envío excede el saldo disponible.',
    },
    error: {
      description: 'Antes de crear una transacción, primero debe agregar un monedero de Bitcoin Vault.',
      title: 'Error',
    },
    header: 'Enviar monedas',
    recovery: {
      confirmFirstSeed: 'Confirmar con Frase Mnemotécnica de Cancelación',
      confirmFirstSeedDesc:
        'Abra el primer documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden',
      confirmSecondSeed: 'Confirmar con Frase Mnemotécnica Rápida',
      confirmSecondSeedDesc:
        'Abre el segundo documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden.',
      confirmSeed: 'Confirmar con Frase Mnemotécnica de Cancelación',
      confirmSeedDesc:
        'Abra el documento PDF que generó al crear su monedero y escriba la frase mnemotécnica de la clave privada en el mismo orden.',
      recover: 'Cancelar',
      useWalletAddress: 'Usar la dirección de este monedero',
    },
    success: {
      description: '¡Bravo! Ha finalizado la transacción correctamente.',
      done: 'Hecho',
      return: 'Volver al Panel',
      title: 'Completado',
    },
    transaction: {
      alert: 'Estándar',
      alertDesc:
        'Esta transacción necesita 144 bloques o unas 24 horas para confirmarse. Puede cancelarla durante este tiempo.',
      fastSuccess: 'Su transacción rápida se ha realizado correctamente.',
      instant: 'Rápida y Segura',
      instantDesc: 'Esta transacción será confirmada inmediatamente. Úsela con extrema precaución.',
      lightningError:
        'Esta dirección parece corresponder a una factura de Lightning. Vaya a su monedero de Lightning para realizar el pago de esa factura.',
      scanInstantKeyDesc:
        'Abra el documento PDF que generó al crear su monedero y escanee el código QR de la clave privada para enviar la transacción.',
      scanInstantKeyTitle: 'Escanee la Clave Rápida',
      type: 'Tipo de transacción',
      watchOnlyError: 'Los monederos que sean solo de lectura no pueden enviar transacciones',
    },
    warning: 'Aviso:',
    warningGeneral:
      'Tenga en cuenta que en el proceso de utilizar la función de Transacción Segura, una parte de los fondos dejados en su monedero puede quedarse bloqueada. Es un procedimiento normal vinculado con UTXO y con los parámetros de la Blockchain del monedero de Bitcoin Vault. Sus fondos serán desbloqueados una vez la transacción se haya verificado (después de unas 24 horas) o cancelado (dentro de las 24 horas).',
  },
  settings: {
    about: 'Sobre',
    aboutUs: 'Sobre nosotros',
    advancedOptions: 'Opciones avanzadas',
    Biometrics: 'Permitir biometría',
    changePin: 'Cambiar PIN',
    electrumServer: 'Servidor Electrum',
    FaceID: 'Permitir FaceID',
    fingerprintLogin: 'Inicio de sesión con huella digital',
    general: 'General',
    header: 'Configuración',
    language: 'Idioma',
    notSupportedFingerPrint: 'Su dispositivo no admite huellas digitales',
    security: 'Seguridad',
    TouchID: 'Permitir huella digital',
  },
  tabNavigator: {
    addressBook: 'Libreta de direcciones',
    authenticators: 'Autenticadores',
    settings: 'Configuración',
    wallets: 'Monederos',
  },
  timeCounter: {
    closeTheApp: 'Cerrar la aplicación',
    description:
      'Se ha bloqueado su aplicación debido a los intentos fallidos de iniciar sesión. Por favor, espere el tiempo necesario para volver a intentarlo.',
    title: 'Aplicación bloqueada',
    tryAgain: 'Volver a intentar',
  },
  transactions: {
    details: {
      addNote: 'Añadir nota',
      addToAddressBook: 'Agregar a la libreta de direcciones',
      amount: 'Monto',
      blocked: 'Bloqueado',
      bytes: 'bytes',
      confirmations: 'confirmaciones',
      copy: 'Copiar',
      copyAndBoriadcast: 'Copiar y transmitir más tarde',
      details: 'Detalles',
      detailTitle: 'Detalles de la transacción',
      fee: 'Comisión',
      from: 'De',
      inputs: 'Inputs',
      noLabel: 'Sin etiqueta',
      note: 'Nota',
      numberOfCancelTransactions: 'Número de transacciones canceladas',
      ouputs: 'Outputs',
      returnedFee: 'Comisión devuelta:',
      satoshiPerByte: 'Satoshi por byte',
      sendCoins: 'Enviar monedas',
      timePending: 'Tiempo restante',
      title: 'Transacción',
      to: 'Para',
      toExternalWallet: 'Al monedero externo',
      toInternalWallet: 'Al monedero interno',
      totalReturnedFee: 'Comisión devuelta en total:',
      transactioFee: 'Comisión de transacción',
      transactionDetails: 'Detalles de la transacción',
      transactionHex: 'Transacción en hexadecimal',
      transactionHexDescription: 'Esta es una transacción hexadecimal, firmada y lista para ser transmitida a la red',
      transactionId: 'ID de transacción',
      transactionType: 'Tipo de transacción',
      txSize: 'Tamaño TX',
      unblocked: 'Desbloqueado',
      verify: 'Verificar en coinb.in',
      viewInBlockRxplorer: 'Ver en el explorador de bloques',
      walletType: 'Tipo de monedero',
    },
    errors: {
      notEnoughBalance: 'No hay saldo suficiente. Por favor, intente enviar una cantidad menor.',
    },
    label: {
      blocked: 'bloqueada',
      canceled: 'cancelada',
      canceledDone: 'cancelada-hecha',
      done: 'hecha',
      pending: 'pendiente',
      unblocked: 'desbloqueada',
    },
    list: {
      conf: 'Confirmaciones',
    },
    transactionTypeLabel: {
      canceled: 'Cancelada',
      secure: 'Segura',
      secureFast: 'Rápida y Segura',
      standard: 'Estándar',
    },
  },
  unlock: {
    confirmButton: 'Confirmar la huella digital para continuar.',
    enter: 'Introducir PIN',
    title: 'Desbloquear',
    touchID: 'Touch ID para «Gold Wallet»',
  },
  unlockTransaction: {
    description: 'Ingrese la contraseña de la transacción para proceder.',
    headerText: 'Confirmar transacción',
    title: 'Confirmar la transacción',
  },
  wallets: {
    add: {
      addWalletButton: 'Agregar un monedero nuevo',
      advancedOptions: 'Opciones avanzadas',
      air: 'Realiza transacciones Seguras, de Cancelación y transacciones Seguras y Rápidas.',
      ar: 'Realiza transacciones Seguras y de Cancelación.',
      description: 'Elija un nombre para su nuevo monedero.',
      failed: 'No se ha podido crear el monedero',
      importWalletButton: 'Importar monedero',
      inputLabel: 'Nombre',
      legacy: 'Realiza tipos de transacciones predeterminadas.',
      legacyHDP2SH:
        'Contiene un árbol de direcciones P2SH generado a partir de una sola frase mnemotécnica de 12 palabras',
      legacyHDP2SHTitle: 'Estándar HD P2SH',
      LegacyHDSegWit:
        'Contiene un árbol de direcciones de segwit nativas, generado a partir de una sola frase mnemotécnica de 12 palabras',
      legacyHDSegWitTitle: 'EstándarHD SegWit',
      LegacyP2SH: 'Contiene una sola dirección P2SH',
      legacyP2SHTitle: 'Estándar P2SH',
      legacyTitle: 'Estándar',
      multipleAddresses:
        'Contiene un árbol de direcciones P2SH generado a partir de una sola frase mnemotécnica de 12 palabras',
      publicKeyError: 'La clave pública proporcionada no es válida',
      segwidAddress:
        'Contiene un árbol de direcciones SegWit nativas, generado a partir de una sola frase mnemotécnica de 12 palabras',
      singleAddress: 'Dirección única',
      subtitle: 'Ponga un nombre a su monedero',
      title: 'Agregar un monedero nuevo',
      walletType: 'Tipo de monedero',
    },
    addSuccess: {
      description:
        'Apunte esta frase mnemotécnica en algún lugar seguro. Es su copia de seguridad en caso de que necesite restaurar su monedero.',
      okButton: 'De acuerdo, ¡lo he apuntado!',
      subtitle: '¡Su monedero está listo! \n¡Ha creado su monedero!',
      title: 'Agregar un monedero nuevo',
    },
    dashboard: {
      allWallets: 'Todos los monederos',
      availableBalance: 'Saldo disponible',
      noTransactions: 'No hay transacciones para mostrar.',
      noWallets: 'No hay monederos',
      noWalletsDesc1: 'No hay monederos para mostrar.',
      noWalletsDesc2: 'para agregar su primer monedero.',
      receive: 'Recibir',
      recover: 'Cancelar',
      send: 'Enviar monedas',
      title: 'Monederos',
      wallet: 'monedero',
    },
    deleteWallet: {
      description1: '¿Está seguro de que quiere eliminar',
      description2: '? No podrá deshacer esta operación.',
      header: 'Eliminar monedero',
      no: 'No',
      title: 'Elimine su monedero',
      yes: 'Sí',
    },
    details: {
      deleteWallet: 'Eliminar monedero',
      details: 'Detalles',
      edit: 'Editar',
      exportWallet: 'Exportar monedero',
      latestTransaction: 'Última transacción',
      nameEdit: 'Editar nombre',
      nameLabel: 'Nombre',
      showWalletXPUB: 'Mostrar monedero XPUB',
      typeLabel: 'Tipo',
    },
    errors: {
      duplicatedPublicKey: 'Ya se ha agregado la clave pública',
      invalidMnemonic: 'Frase mnemotécnica no válida',
      invalidMnemonicWordsNumber:
        'Palabras proporcionadas {receivedWordsNumber} palabras esperadas {expectedWordsNumber}',
      invalidPrivateKey: 'Clave privada no válida',
      invalidPublicKey: 'Clave pública no válida',
      invalidQrCode: 'Código QR no válido',
      invalidSign: 'No se ha podido firmar la transacción',
      noIndexForWord: 'No se ha podido encontrar el índice para la palabra: {word}',
    },
    export: {
      title: 'exportar monedero',
    },
    exportWallet: {
      header: 'Exportar monedero',
      title: 'Frase mnemotécnica',
    },
    exportWalletXpub: {
      header: 'Monedero XPUB',
    },
    import: {
      do_import: 'Importar',
      error: 'Error al importar. Asegúrese de que los datos proporcionados son válidos.',
      explanation:
        'Escriba aquí su frase mnemotécnica, clave privada, WIF o cualquier cosa que tenga. GoldWallet hará todo lo posible para adivinar el formato correcto e importar su monedero',
      imported: 'Importado',
      scan_qr: 'o escanear el código QR en su lugar?',
      success: 'Completado',
      title: 'importar',
    },
    importWallet: {
      chooseTypeDescription: 'Seleccione el tipo de monedero que desea importar.',
      customWords: 'Palabras personalizadas',
      extendWithCustomWords: 'Extender esta frase mnemotécnica con palabras personalizadas',
      header: 'Importar monedero',
      import: 'Importar',
      importARDescription1: 'Introduzca la frase mnemotécnica',
      importARDescription2: 'Escanee el código QR del monedero que desea importar',
      placeholder: 'Frase mnemotécnica',
      scanCancelPubKey: 'Escanee el código QR de la clave de Cancelación',
      scanFastPubKey: 'Escanee el código QR de la Clave Rápida',
      scanPublicKeyDescription:
        'Abra el primer documento PDF que generó cuando creó el monedero que desea importar y use esta aplicación para escanear el código QR de la clave pública.',
      scanQrCode: 'o escanear el código QR',
      scanWalletAddress: 'Escanee la dirección del monedero',
      scanWalletAddressDescription:
        'Escanee el código QR de la dirección pública para iniciar la integración con GoldWallet.',
      subtitle:
        'Escriba aquí su frase mnemotécnica, clave privada, WIF o cualquier dato que tenga. GoldWallet hará todo lo posible para adivinar el formato correcto e importar su monedero.',
      title: 'Importe su monedero',
      unsupportedElectrumVaultMnemonic:
        'Esta frase mnemotécnica es de Electrum Vault y actualmente no es aspoyada. Será apoyada en un futuro próximo.',
      walletInUseValidationError: 'El monedero ya está en uso. Introduzca un monedero válido.',
      allWalletsValidationError: 'No puede introducir el nombre "Todos monederos"',
    },
    publicKey: {
      instantDescription:
        'Vaya al Generador de Claves web en un dispositivo diferente, refresque la página y use esta aplicación para escanear el nuevo código QR de clave pública. ¡Recuerde exportar sus claves como PDF!',
      instantSubtitle: 'Agregar Clave Rápida',
      recoveryDescription:
        'Vaya al Generador de Claves web en un dispositivo diferente y use esta aplicación para escanear el código QR de clave pública. ¡Recuerde exportar sus claves como PDF!',
      recoverySubtitle: 'Agregar Clave de Cancelación',
      scan: 'Escanear',
      webKeyGenerator: 'Generador de claves web:',
    },
    scanQrWif: {
      bad_password: 'Contraseña incorrecta',
      bad_wif: 'WIF incorrecto',
      cancel: 'Cancelar',
      decoding: 'Descifrando',
      go_back: 'Volver',
      imported_legacy: 'Estándar importado',
      imported_segwit: 'SegWit importado',
      imported_watchonly: 'Versión de solo lectura importada',
      imported_wif: 'WIF importado',
      input_password: 'Introduzca la contraseña',
      password_explain: 'Esta es una clave privada BIP38 cifrada',
      wallet_already_exists: 'Este monedero ya existe',
      with_address: 'con dirección',
    },
    wallet: {
      latest: 'Última transacción',
      none: 'Ninguna',
      pendingBalance: 'Saldo bloqueado',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Monederos',
    },
  },
};
