module.exports = {
  _: {
    bad_password: 'Yanlış parola, tekrar deneyin',
    cancel: 'İptal Et',
    click: 'Tıkla',
    confirm: 'Onayla',
    continue: 'Devam et',
    copied: 'Kopyalandı!',
    copy: 'Kopyala',
    created: 'Oluşturulma tarihi',
    delete: 'Sil',
    enter_password: 'Parolayı girin',
    here: 'buraya',
    invalid: 'Geçersiz',
    languageCode: 'tr',
    never: 'asla',
    next: 'İleri',
    ok: 'Tamam',
    or: 'veya',
    satoshi: 'Satoshi',
    save: 'Kaydet',
    scan: 'Tarat',
    storage_is_encrypted: 'Kasanız şifrelidir. Açmak için parola gereklidir.',
  },
  aboutUs: {
    alwaysBackupYourKeys: 'Her zaman anahtarlarınızı yedekleyin',
    buildWithAwesome: 'Muhteşem özellikle oluştur:',
    goToOurGithub: 'Github’umuza Git',
    header: 'Hakkımızda',
    rateGoldWallet: 'GoldWallet’ı Puanla',
    releaseNotes: 'Sürüm notları',
    runSelfTest: 'Otomatik testi çalıştır',
    title: 'Gold Wallet ücretsiz ve açık kaynaklı bir Bitcoin Vault cüzdanıdır. Lisanslı MIT.',
  },
  advancedOptions: {
    description:
      'Gelişmiş seçenekleri yapılandırmak aşağıda yer alan farklı cüzdan türleri arasından seçim yapmanıza imkan verir: \n  P2SH, HD P2SH, HD segwit.',
    title: 'Gelişmiş seçenekleri yapılandır',
  },
  authenticators: {
    add: {
      description:
        'Electrum Vault masaüstü uygulamanızı açın ve yeni bir cüzdan oluşturun. Bir QR kodu görene kadar ekrandaki adımları takip edin. Devam etmek için taratmak üzere bu uygulamayı kullanın.',
      subdescription: 'Kimlik doğrulayıcınızı aynı zamanda aşağıdaki seçeneği seçerek de içeri aktarabilirsiniz.',
      subtitle: 'Kimlik doğrulayıcıyı eşleştir',
      successDescription:
        'Bu çekirdek ifadeyi güvenli bir yere yazın. Kimlik doğrulayıcınızı geri yüklemeniz gerekmesi halinde bu yedek olacaktır. Hızlı ve İptal işlemlerini onaylamak için kimlik doğrulayıcının zorunlu olduğunu unutmayın.',
      successTitle: 'Kimlik doğrulayıcınız hazır!',
      title: 'Yeni kimlik doğrulayıcı ekle',
    },
    delete: {
      subtitle: 'Kimlik doğrulayıcınzı silin',
      success: 'Kimlik doğrulayıcınız başarıyla silindi. Her zaman yeni bir kimlik doğrulayıcı oluşturabilirsiniz.',
      title: 'Kimlik doğrulayıcıyı sil',
    },
    enterPIN: {
      description: 'Eşleştirme sürecini tamamlamak için bu PIN’i Electrum Vault masaüstü uygulamasına girin.',
      subtitle: 'PIN Girin',
    },
    errors: {
      noEmpty: 'Alan boş olamaz',
    },
    export: {
      title: 'Kimlik doğrulayıcıyı dışarı aktar',
    },
    import: {
      code: 'Kod:',
      desc1: 'Çekirdek ifadeyi yazın veya içeri aktarmak istediğiniz kimlik doğrulayıcının QR kodunu taratın.',
      desc2: 'Aşağıdaki “veya QR kodunu tarat”a tıklayarak QR kodunu taratın',
      inUseValidationError: 'Ad benzersiz olmalıdır. Lütfen geçerli bir ad girin.',
      mnemonicLength: 'Anımsatıcı 12 kelimeden oluşmalıdır.',
      multipleQrCodesDescription:
        'Bazı işlemlerde birden fazla QR kod oluşturulur. Electrum Vault uygulamasında hepsini tarattığınızdan emin olun.',
      multipleQrCodesTitle: 'Başka bir QR kodu tarat',
      scanNext: 'Sonrakini tarat',
      subtitle: 'Kimlik doğrulayıcınızı içeri aktarın',
      success: 'Kimlik doğrulayıcınızı başarıyla içeri aktardınız. Artık kullanıma hazır.',
      textAreaPlaceholder: 'Çekirdek ifade',
      title: 'Kimlik doğrulayıcıyı içeri aktar',
    },
    list: {
      noAuthenticators: 'Henüz kimlik doğrulayıcı yok',
      noAuthenticatorsDesc1: 'Dokunun',
      noAuthenticatorsDesc2: 've ilk kimlik doğrulayıcınızı ekleyin.',
      scan: 'Tara',
      title: 'Bitcoin Vault Kimlik Doğrulayıcılar',
    },
    options: {
      delete: 'Kimlik doğrulayıcıyı sil',
      export: 'Kimlik doğrulayıcıyı dışarı aktar',
      pair: 'Kimlik doğrulayıcıyı eşleştir',
      sectionTitle: 'Genel',
      title: 'Kimlik doğrulayıcı seçenekleri',
    },
    pair: {
      descPin: 'Kimlik doğrulayıcının masaüstü uygulamanızla eşleşmesini doğrulamak için bu PIN’i kullanın.',
      descPublicKey:
        'Bu Açık Anahtarı, kimlik doğrulayıcınızı GoldWallet seçeneği ile cüzdan oluşturma işlemi sırasında masaüstü uygulamanıza aktarmak için kullanabilirsiniz.',
      pin: 'PIN',
      publicKey: 'Açık Anahtar',
      title: 'Kimlik doğrulayıcıyı eşleştir',
    },
    publicKey: {
      okButton: 'Tamam, anladım',
      subtitle:
        'Bu Açık Anahtarı 2FA cüzdanının oluşturulması sırasında kimlik doğrulayıcınızı Electrum Vault masa üstü uygulamasına aktarmak için kullanabilirsiniz.',
      title: 'Açık Anahtar',
    },
    sign: {
      error: 'Kimlik doğrulayıcılardan hiçbiri işlemi imzalayamadı',
    },
  },
  betaVersion: {
    button: 'Riski kabul ediyorum',
    description:
      'Hala resmi olarak piyasaya sürülme öncesinde nihai test aşamasındadır. Mobil uygulaması ve tüm içeriği "olduğu gibi" ve "kullanılabildiği gibi" esasına göre sunulur. Yazılımın kullanımına ait riskler kullanıcıya aittir.',
    title: "Bu GoldWallet'in beta sürümüdür",
  },
  contactCreate: {
    addressLabel: 'Adres',
    buttonLabel: 'Yeni kişi ekle',
    description: 'Lütfen yeni kişinizin\n  adını ve adresini girin.',
    nameCannotContainSpecialCharactersError: 'İsim özel karakterler içeremez.',
    nameLabel: 'Ad',
    nameMissingAlphanumericCharacterError: 'İsimde alfanümerik karakter eksik.',
    screenTitle: 'Yeni kişi ekle',
    subtitle: 'Yeni kişi',
    successButton: 'Adres defterine geri dön',
    successDescription: 'Oley! Başarılı bir şekilde\n  yeni kişi eklediniz.',
    successTitle: 'Başarılı',
  },
  contactDelete: {
    description1: 'Silmek istediğinizden emin misiniz',
    description2: '?\n  Bu işlemi geri alamazsınız.',
    header: 'Kişiyi sil',
    no: 'Hayır',
    success: 'Başarılı',
    successButton: 'Adres defterine geri dön',
    successDescription: 'Kişiniz başarıyla silindi.\n  Şimdi Adres Defterine geri dönebilirsiniz.',
    title: 'Kişinizi silin',
    yes: 'Evet',
  },
  contactDetails: {
    addressLabel: 'Adres',
    deleteButton: 'Kişiyi sil',
    editAddress: 'Adresi düzenle',
    editName: 'Adı düzenle',
    nameLabel: 'Ad',
    sendCoinsButton: 'Coin gönder',
    share: 'Paylaş',
    showQRCodeButton: 'QR kodunu göster',
  },
  contactList: {
    cancel: 'İptal Et',
    noContacts: 'Kişi yok',
    noContactsDesc1: 'Gösterilecek kişi yok. \n  Tıkla',
    noContactsDesc2: 'İlk bağlantınızı ekleyin.',
    noResults: 'Şunun için sonuç yok:',
    screenTitle: 'Adres Defteri',
    search: 'Ara',
  },
  electrumServer: {
    connectionError: 'Sağlanan Electrum sunucusuna bağlanılamıyor',
    description: 'Uygulamanızın bağlanacağı sunucunun adresini değiştirebilirsiniz. Varsayılan adres önerilir.',
    header: 'Electrum sunucusu',
    host: 'ana bilgisayar',
    port: 'port',
    save: 'Kaydet',
    successfullSave:
      'Değişiklikleriniz başarıyla kaydedildi. Değişikliklerin geçerli olması için yeniden başlatma gerekebilir.',
    title: 'Electrum sunucusunu değiştir',
    useDefault: 'Varsayılanı kullan',
  },
  filterTransactions: {
    clearAll: 'Tümünü sil',
    clearFilters: 'filtreleri sil',
    filter: 'filtrele',
    from: 'gönderen',
    fromAmount: 'ilk tutar',
    fromDate: 'başlangıç tarihi',
    header: 'işlemleri filtreleri',
    receive: 'al',
    received: 'Alındı',
    send: 'gönder',
    sent: 'Gönderildi',
    status: {
      canceled: 'İptal Edildi',
      canceledDone: 'İptal edildi - tamamlandı',
      done: 'Tamamlandı',
      pending: 'Beklemede',
    },
    to: 'alan',
    toAmount: 'son tutar',
    toDate: 'bitiş tarihi',
    transactionStatus: 'İşlem durumu',
    transactionType: 'İşlem türü',
  },
  message: {
    allDone: 'Tamam!',
    cancelTxSuccess: 'İşleminizi başarıyla iptal ettiniz.\n  Coinleriniz yolda.',
    creatingAuthenticator: 'Kimlik doğrulayıcınız oluşturuluyor',
    creatingAuthenticatorDescription:
      'Lütfen biz kimlik doğrulayıcınızı oluştururken bekleyin.\n  Biraz zaman alabilir.',
    creatingWallet: 'Cüzdanınız oluşturuluyor',
    creatingWalletDescription: 'Lütfen cüzdanınız oluşturulurken bekleyin. Biraz zaman alabilir.',
    generateAddressesError: 'Adresler oluşturulamadı',
    hooray: 'Oley!',
    importingAuthenticator: 'Kimlik doğrulayıcınız içeri aktarılıyor',
    importingAuthenticatorDescription:
      'Lütfen biz kimlik doğrulayıcınızı içeri aktarırken bekleyin.\n  Biraz zaman alabilir.',
    noTransactions: 'Cüzdanda herhangi bir işlem bulunamadı',
    noTransactionsDesc: 'Muhtemelen daha önce hiç kullanılmamış bir cüzdanı içeri aktarmaya çalışıyorsunuz',
    returnToAuthenticators: 'Kimlik Doğrulayıcılara Geri Dön',
    returnToDashboard: 'Panoya Geri Dön',
    returnToWalletChoose: 'Cüzdan türü seçimine geri dön',
    returnToWalletImport: 'Cüzdan içe aktarmaya geri dön',
    somethingWentWrong: 'Bir sorun meydana geldi',
    somethingWentWrongWhileCreatingWallet:
      'Cüzdanınızı oluştururken bir sorun meydana geldi Lütfen Panoya dönün ve yeniden deneyin.',
    success: 'Başarılı',
    successfullWalletDelete: 'Cüzdanınız başarıyla silindi. Şimdi Panoya geri dönebilirsiniz.',
    successfullWalletImport: 'Cüzdanınız başarıyla içeri aktarıldı. Şimdi Panoya geri dönebilirsiniz.',
    wrongMnemonic: 'Yanlış anımsatıcı',
    wrongMnemonicDesc:
      'Anımsatıcınız desteklenen herhangi bir cüzdanla eşleşmiyor. Geçersiz bir anımsatıcıyı içeri aktarmaya çalışıyorsunuz veya cüzdan daha önce kullanılmamış',
  },
  onboarding: {
    changePin: 'PIN’i Değiştir',
    confirmNewPin: 'Yeni PIN’i Onayla',
    confirmPassword: 'İşlem şifresini onayla',
    confirmPin: 'PIN’i Onayla',
    createNewPin: 'Yeni PIN',
    createPassword: 'İşlem şifresi oluştur',
    createPasswordDescription:
      'İşlem Şifreniz tüm işlemleri doğrulamak için kullanılacak. Daha sonra değiştiremezsiniz. İşlem Şifresi en az 8 alfanümreik karakter içermelidir.',
    createPin: 'PIN oluştur',
    createPinDescription:
      'PIN’iniz uygulamaya giriş yapmak için kullanılacaktır. Daha sonra Ayarlar bölümünden değiştirebilirsiniz.',
    currentPin: 'Mevcut PIN',
    failedTimes: 'Başarısız denemeler',
    failedTimesErrorInfo: 'Üç başarısız denemeden sonra şu kadar süreyle giriş yapamazsınız:',
    goBack: 'Geri git',
    minutes: 'dakika.',
    numberOfAttemptsExceeded: 'Deneme sayısı aşıldı',
    onboarding: 'Katılım',
    passwordDoesNotMatch: 'Şifre eşleşmiyor. Lütfen geçerli bir şifre girin.',
    pin: 'PIN',
    pinDoesNotMatch: 'PIN eşleşmiyor. Lütfen geçerli bir PIN girin.',
    seconds: 'saniye',
    successButton: 'Panoya Git',
    successButtonChangedPin: 'Ayarlara Geri Dön',
    successDescription: 'Oley! PIN’inizi başarıyla oluşturdunuz.',
    successDescriptionChangedPin: 'Oley! PIN’inizi başarıyla değiştirdiniz.',
    tryAgain: 'Tekrar denemek için',
  },
  receive: {
    details: {
      amount: 'Tutar',
      receiveWithAmount: 'Tutarla al',
      receiveWithAmountSubtitle: 'Almak istediğiniz tutarı girin. QR kodu tutarı içerecek şekilde güncellenecektir.',
      share: 'Paylaş',
      shareWalletAddress: 'Cüzdan adresini paylaş',
    },
    header: 'Coin al',
    label: 'Cüzdan adresi',
  },
  scanQrCode: {
    cancel: 'İptal Et',
    ok: 'Tamam',
    permissionMessage: 'Kameranızı kullanmak için izninize ihtiyacımız var.',
    permissionTitle: 'Kamera kullanma izni',
  },
  security: {
    jailBrokenPhone:
      'Cihazınızın yazılımını kırdırdığınız (jailbroken) görülüyor. Bu güvenlik sorunlarına, çökmelere veya diğer sorunlara yol açabilir. Yazılımı kırdırılmış (jailbroken) bir cihazda GoldWallet kullanmanızı önermiyoruz.',
    noPinOrFingerprintSet:
      'Cihazınızda pin veya parmak için belirlenmemiş görünüyor. Güvenli olmayan bir cihazda GoldWallet kullanmanızı önermiyoruz.',
    rootedPhone:
      'Cihazınızın kök yazılımına erişiminiz olduğu (rooted) görülüyor. Bu güvenlik sorunlarına, çökmelere veya diğer sorunlara yol açabilir. Kök yazılımına erişilmiş (rooted) bir cihazda GoldWallet kullanmanızı önermiyoruz.',
    title: 'Güvenlik sorunu',
  },
  selectLanguage: {
    alertDescription: 'Dili seçilsin ve uygulama yeniden başlatılsın mı?',
    cancel: 'İptal Et',
    confirm: 'Onayla',
    confirmation: 'Onay',
    header: 'Dil',
    restartInfo:
      'Yeni bir dil seçerken GoldWallet’ı yeniden başlatmak değişikliğin geçerli olması için gerekli olabilir',
  },
  send: {
    confirm: {
      availableBalance: 'İşlem sonrasında kullanılabilir bakiye',
      cancelNow: 'Şimdi iptal et',
      pendingBalance: 'İşlem sonrasında bekleyen bakiye',
      sendNow: 'Şimdi gönder',
    },
    create: {
      amount: 'Tutar',
      fee: 'Ücret',
      headerText:
        'Ağda bekleyen çok sayıda işlem olduğunda (>1500), işleminizin daha hızlı işlenmesi için gereken ücret artacaktır. Genel değerler 1-500 sat/b’dir.',
      setTransactionFee: 'Bir işlem ücreti belirle',
    },
    details: {
      address: 'adres',
      address_field_is_not_valid: 'Adres alanı geçerli değil',
      amount_field_is_not_valid: 'Tutar alanı geçerli değil',
      amount_placeholder: 'gönderilecek tutar (BTCV cinsinden)',
      cancel: 'İptal Et',
      create: 'Fatura Oluştur',
      create_tx_error: 'İşlem oluşturulurken bir hata oluştu. Lütfen adresin geçerli olduğundan emin olun.',
      fee: 'Ücret:',
      fee_field_is_not_valid: 'Ücret alanı geçerli değil',
      fee_placeholder: 'artı işlem ücreti (BTCV cinsinden)',
      feeUnit: 'Sat/B',
      next: 'İleri',
      note: 'Not (opsiyonel)',
      note_placeholder: 'kendime not',
      remaining_balance: 'Kalan bakiye',
      scan: 'Tara',
      send: 'Gönder',
      title: 'işlem oluştur',
      to: 'Alıcı',
      total_exceeds_balance: 'Gönderilen tutar kullanılabilir bakiyeyi aşıyor.',
    },
    error: {
      description: 'Bir işlem oluşturmadan önce ilk olarak bir Bitcoin Vault Cüzdanı eklemelisiniz',
      title: 'Hata',
    },
    header: 'Coin gönder',
    recovery: {
      confirmFirstSeed: 'İptal :Çekirdek İfadesiyle Onaylayın',
      confirmFirstSeedDesc:
        'Cüzdanınızı oluştururken hazırladığınız ilk PDF belgesini açın ve Özel Anahtar çekirdek ifadesini aynı sırada yazın.',
      confirmSecondSeed: 'Hızlı Çekirdek İfadesiyle Onaylayın',
      confirmSecondSeedDesc:
        'Cüzdanınızı oluştururken hazırladığınız ikinci PDF belgesini açın ve Özel Anahtar çekirdek ifadesini aynı sırada yazın.',
      confirmSeed: 'İptal :Çekirdek İfadesiyle Onaylayın',
      confirmSeedDesc:
        'Cüzdanınızı oluştururken hazırladığınız PDF belgesini açın ve Özel Anahtar çekirdek ifadesini aynı sırada yazın.',
      recover: 'İptal Et',
      useWalletAddress: 'Bu cüzdanın adresini kullanın',
    },
    success: {
      description: 'Oley! İşlemi başarıyla tamamladınız.',
      done: 'Tamamlandı',
      return: 'Panoya Geri Dön',
      title: 'Başarılı',
    },
    transaction: {
      alert: 'Standart',
      alertDesc:
        'Bu işlemin onaylanması için 144 blok ve yaklaşık 24 saat süre gereklidir. Bu süre içinde işlemi iptal edebilirsiniz.',
      fastSuccess: 'Hızlı işleminizi başarıyla gerçekleştirdiniz.',
      instant: 'Hızlı',
      instantDesc: 'Bu işlem anında onaylanır. Çok dikkatli kullanın.',
      lightningError:
        'Bu adres bir Lightning faturası için gibi görünüyor. Lütfen bu fatura için bir ödeme yapmak amacıyla Lightning cüzdanınıza gidin.',
      scanInstantKeyDesc:
        'Cüzdanınızı oluştururken hazırladığınız PDF belgesini açın ve işlemi göndermek için Özel Anahtar QR kodunu taratın.',
      scanInstantKeyTitle: 'Hızlı Anahtarı taratın',
      type: 'İşlem türü',
      watchOnlyError: 'Yalnızca izlenebilir cüzdanlar işlem gönderemez',
    },
    warning: 'Uyarı:',
    warningGeneral:
      'Uyarı: Lütfen Güvenli İşlem özelliğini kullanma sırasında cüzdanınızda kalan fonların bir kısmının bloke edilebileceğini dikkate alın. Bu UTXO ve Bitcoin Vault cüzdanının bitcoin parametreleriyle ile ilişkili normal bir prosedürdür. Fonlarınızın blokesi işlem tamamlandıktan sonra (yaklaşık 24 saat sonra) veya iptal edildikten sonra (24 saat içinde) kaldırılacaktır.',
  },
  settings: {
    about: 'Hakkında',
    aboutUs: 'Hakkımızda',
    advancedOptions: 'Gelişmiş seçenekler',
    Biometrics: 'Biometriklere izin ver',
    changePin: 'PIN Değiştir',
    electrumServer: 'Electrum sunucusu',
    FaceID: 'FaceID’ye izin ver',
    fingerprintLogin: 'Parmak iziyle giriş',
    general: 'Genel',
    header: 'Ayarlar',
    language: 'Dil',
    notSupportedFingerPrint: 'Cihazınız parmak izini desteklemiyor',
    security: 'Güvenlik',
    TouchID: 'Parmak izine izin ver',
  },
  tabNavigator: {
    addressBook: 'Adres Defteri',
    authenticators: 'Kimlik Doğrulayıcılar',
    settings: 'Ayarlar',
    wallets: 'Cüzdanlar',
  },
  timeCounter: {
    closeTheApp: 'Uygulamayı kapatın',
    description:
      'Başarısız oturum açma denemeleri nedeniyle uygulamanız engellendi. Lütfen yeniden denemek için gerekli sürenin geçmesini bekleyin.',
    title: 'Uygulama engellendi',
    tryAgain: 'Yeniden deneyin',
  },
  transactions: {
    details: {
      addNote: 'Not ekle',
      addToAddressBook: 'Adres defterine ekle',
      amount: 'Tutar',
      blocked: 'Engelli',
      bytes: 'bayt',
      confirmations: 'onaylar',
      copy: 'Kopyala',
      copyAndBoriadcast: 'Kopyala ve daha sonra yayınla',
      details: 'Ayrıntılar',
      detailTitle: 'İşlem ayrıntıları',
      fee: 'Ücret',
      from: 'Gönderen',
      inputs: 'Girdiler',
      noLabel: 'Etiket yok',
      note: 'Not',
      numberOfCancelTransactions: 'İptal işlemlerinin sayısı',
      ouputs: 'Çıktılar',
      returnedFee: 'İade edilen ücret:',
      satoshiPerByte: 'Bayt başına Satoshi',
      sendCoins: 'Coin gönder',
      timePending: 'Bekleme süresi',
      title: 'İşlem',
      to: 'Alıcı',
      toExternalWallet: 'Harici cüzdana',
      toInternalWallet: 'Dahili cüzdana',
      totalReturnedFee: 'Toplam iade edilen ücret:',
      transactioFee: 'İşlem ücreti',
      transactionDetails: 'İşlem ayrıntıları',
      transactionHex: 'İşlem on altılığı',
      transactionHexDescription: 'Bu işlem on altılığıdır, imzalanmıştır ve ağda yayınlanmaya hazırdır',
      transactionId: 'İşlem Kimliği',
      transactionType: 'İşlem türü',
      txSize: 'TX boyutu',
      unblocked: 'Engeli kaldırıldı',
      verify: 'Coinb.in üzerinde doğrula',
      viewInBlockRxplorer: 'Blok gezgininde görüntüle',
      walletType: 'Cüzdan türü',
    },
    errors: {
      notEnoughBalance: 'daha küçük bir tutar göndermek.',
    },
    label: {
      blocked: 'engellendi',
      canceled: 'İptal Edildi',
      canceledDone: 'İptal edildi - tamamlandı',
      done: 'tamamlandı',
      pending: 'beklemede',
      unblocked: 'bloke kalktı',
    },
    list: {
      conf: 'Onaylar',
    },
    transactionTypeLabel: {
      canceled: 'İptal Edildi',
      secure: 'Güvenli',
      secureFast: 'Güvenli Hızlı',
      standard: 'Standart',
    },
  },
  unlock: {
    confirmButton: 'Devam etmek için parmak iziyle doğrulama yapın.',
    enter: 'PIN Girin',
    title: 'Kilidi Aç',
    touchID: '"Gold Wallet" için Touch ID',
  },
  unlockTransaction: {
    description: 'İşleme devam etmek için İşlem Şifresini Onaylayın.',
    headerText: 'İşlemi onayla',
    title: 'İşlem Şifresini Onayla',
  },
  wallets: {
    add: {
      addWalletButton: 'Yeni cüzdan ekle',
      advancedOptions: 'Gelişmiş seçenekler',
      air: 'Standart, İptal Etme ve Hızlı işlemlerini gerçekleştirir.',
      ar: 'Standart ve İptal Etme işlemleri gerçekleştirir.',
      description: 'Lütfen cüzdanınız için bir ad girin.',
      failed: 'Cüzdan oluşturulamadı',
      importWalletButton: 'Cüzdanı içeri aktar',
      inputLabel: 'Ad',
      legacy: 'Varsayılan işlem türlerini gerçekleştirir.',
      legacyHDP2SH: '12 kelimelik tek bir çekirdekten oluşturulmuş bir P2SH adresleri ağacı içerir',
      legacyHDP2SHTitle: 'Legacy HD P2SH',
      LegacyHDSegWit: '12 kelimelik tek bir çekirdekten oluşturulmuş bir native segwit adresleri ağacı içerir',
      legacyHDSegWitTitle: 'Legacy HD SegWit',
      LegacyP2SH: 'Tek bir P2SH adresi içerir',
      legacyP2SHTitle: 'Legacy P2SH',
      legacyTitle: 'Legacy',
      multipleAddresses: 'Çoklu adresler',
      publicKeyError: 'Sağlanan açık anahtar geçerli değil',
      segwidAddress: 'Tek bir 12 kelimelik seedden oluşturulmuş yerli segwit adreslerinden oluşan ağaç içerir',
      singleAddress: 'Tek adres',
      subtitle: 'Cüzdanınıza ad verin',
      title: 'Yeni cüzdan ekle',
      walletType: 'Cüzdan türü',
    },
    addSuccess: {
      description:
        'Cüzdanınız oluşturuldu. Lütfen özel ipucu ifadesini bir kağıda not almak için zaman ayırın. Bu sizin yedeğiniz olacaktır. Diğer cihazlarda cüzdanı geri yüklemek için kullanabilirsiniz.',
      okButton: 'Tamam, bunu yazdım!',
      subtitle: 'Başarılı',
      title: 'Yeni cüzdan ekle',
    },
    dashboard: {
      allWallets: 'Tüm cüzdanlar',
      availableBalance: 'Kullanılabilir bakiye',
      noTransactions: 'Gösterilecek işlem yok.',
      noWallets: 'Cüzdan yok',
      noWalletsDesc1: 'Gösterilecek cüzdan yok.',
      noWalletsDesc2: 'İlk cüzdanınızı eklemek için.',
      receive: 'Coin al',
      recover: 'İptal Et',
      send: 'Coin gönder',
      title: 'Cüzdanlar',
      wallet: 'cüzdan',
    },
    deleteWallet: {
      description1: 'Silmek istediğinizden emin misiniz',
      description2: '? Bu işlemi geri alamazsınız.',
      header: 'Cüzdanı sil',
      no: 'Hayır',
      title: 'Cüzdanınızı silin',
      yes: 'Evet',
    },
    details: {
      deleteWallet: 'Cüzdanı sil',
      details: 'Ayrıntılar',
      edit: 'Düzenle',
      exportWallet: 'Cüzdanı dışarı aktar',
      latestTransaction: 'Son işlem',
      nameEdit: 'Adı düzenle',
      nameLabel: 'Ad',
      showWalletXPUB: 'Cüzdan XPUB’ını göster',
      typeLabel: 'Tür',
    },
    errors: {
      duplicatedPublicKey: 'Açık anahtar zaten eklendi',
      invalidMnemonic: 'Geçersiz anımsatıcı',
      invalidMnemonicWordsNumber: '{receivedWordsNumber} kelime girildi, {expectedWordsNumber} kelime bekleniyor',
      invalidPrivateKey: 'Geçersiz özel anahtar',
      invalidPublicKey: 'Geçersiz açık anahtar',
      invalidQrCode: 'Geçersiz QR kodu',
      invalidSign: 'İşlem imzalanamıyor',
      noIndexForWord: 'Şu kelime için endeks bulunamadı: {word}',
    },
    export: {
      title: 'Cüzdanı dışarı aktarma',
    },
    exportWallet: {
      header: 'Cüzdanı dışarı aktar',
      title: 'Özel ipucu ifadesi',
    },
    exportWalletXpub: {
      header: 'Cüzdanın XPUB’ı',
    },
    import: {
      do_import: 'İçeri aktar',
      error: 'İçeri aktarılamadı. Lütfen sağlanan verilerin geçerli olduğundan emin olun.',
      explanation:
        'Buraya hatırlatıcı ipucunuzu, özel anahtarınızı, WIF’ı veya sahip olduğunuz başka bir şeyi yazın. GoldWallet doğru biçimi tahmin etmek ve cüzdanınızı içeri aktarmak için elinden geleni yapacak',
      imported: 'İçeri aktarıldı',
      scan_qr: 'veya onun yerine QR kodunu tarasın mı?',
      success: 'Başarılı',
      title: 'İçeri aktar',
    },
    importWallet: {
      chooseTypeDescription: 'İçeri aktarmak istediğiniz cüzdan türünü seçin.',
      customWords: 'Özel kelimeler',
      extendWithCustomWords: 'Bu çekirdeği özel kelimelerle genişletin',
      header: 'Cüzdanı içeri aktar',
      import: 'İçeri aktar',
      importARDescription1: 'Çekirdek ifadeyi girin',
      importARDescription2: 'İçeri aktarmak istediğiniz cüzdanın QR kodunu tarayın',
      placeholder: 'Özel ipucu, özel anahtar, WIF',
      scanCancelPubKey: 'İptal Anahtarı QR kodunu tarayın',
      scanFastPubKey: 'Hızlı Anahtar QR kodunu tarayın',
      scanPublicKeyDescription:
        'İçeri aktarmak istediğiniz cüzdanı ilk oluşturduğunuzda hazırladığınız ilk PDF belgesini açın ve Açık Anahtar QR kodunu taramak için bu uygulamayı kullanın.',
      scanQrCode: 'veya QR kodunu tara',
      scanWalletAddress: 'Cüzdan adresini tarayın',
      scanWalletAddressDescription: 'GoldWallet ile entegrasyonu başlatmak için Açık Adres QR kodunu tarayın',
      subtitle:
        'Buraya hatırlatıcı ipucunuzu, özel anahtarınızı, WIF’ı veya sahip olduğunuz başka bir şeyi yazın. GoldWallet doğru biçimi tahmin etmek ve cüzdanınızı içeri aktarmak için elinden geleni yapacak.',
      title: 'Cüzdanınızı içeri aktarın',
      unsupportedElectrumVaultMnemonic:
        'Bu kök Electrum Vault’tandır ve şu anda desteklenmemektedir. Yakın gelecekte desteklenecektir.',
      walletInUseValidationError: 'Cüzdan zaten kullanılıyor. Lütfen geçerli bir cüzdan girin.',
    },
    publicKey: {
      instantDescription:
        'Ayrı bir cihazdan web Anahtarı Oluşturucuya gidin ve Açık Anahtar QR kodunu taratmak için bu uygulamayı kullanın. Anahtarlarınızı PDF olarak dışarı aktarmayı unutmayın!',
      instantSubtitle: 'Hızlı Anahtar Ekle',
      recoveryDescription:
        'Ayrı bir cihazdan web Anahtarı Oluşturucuya gidin ve Açık Anahtar QR kodunu taratmak için bu uygulamayı kullanın. Anahtarlarınızı PDF olarak dışarı aktarmayı unutmayın!',
      recoverySubtitle: 'İptal Anahtarı Ekle',
      scan: 'Tara',
      webKeyGenerator: 'Web Anahtarı Oluşturucu',
    },
    scanQrWif: {
      bad_password: 'Yanlış parola',
      bad_wif: 'Yanlış WIF',
      cancel: 'İptal Et',
      decoding: 'Şifre çözülüyor',
      go_back: 'Geri Git',
      imported_legacy: 'İçeri Aktarılan Eski',
      imported_segwit: 'İçeri Aktarılan SegWit',
      imported_watchonly: 'İçeri Aktarılan Yalnızca İzlenebilir',
      imported_wif: 'WIF İçeri Aktarıldı',
      input_password: 'Parola girin',
      password_explain: 'Bu BIP38 şifrelenmiş özel anahtardır',
      wallet_already_exists: 'Böyle bir cüzdan zaten var',
      with_address: 'adres ile',
    },
    wallet: {
      latest: 'Son işlem',
      none: 'Hiçbiri',
      pendingBalance: 'Bekleyen bakiye',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Cüzdanlar',
    },
  },
};
