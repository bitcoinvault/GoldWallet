module.exports = {
  _: {
    bad_password: 'Kata sandi buruk, coba lagi',
    cancel: 'Batalkan',
    click: 'Klik',
    confirm: 'Konfirmasi',
    continue: 'Lanjutkan',
    copied: 'Disalin!',
    copy: 'Salin',
    created: 'Dibuat pada',
    delete: 'Hapus',
    enter_password: 'Masukkan kata sandi',
    here: 'Disini',
    invalid: 'Tidak Valid',
    languageCode: 'id',
    never: 'tidak pernah',
    next: 'Berikutnya',
    ok: 'OK',
    or: 'atau',
    satoshi: 'Satoshi',
    save: 'Simpan',
    scan: 'Pindai',
    storage_is_encrypted: 'Penyimpanan Anda dienkripsi. Perlu kata sandi untuk mendekripsinya',
  },
  termsConditions: {
    header: 'Syarat & Ketentuan',
    title: 'Persetujuan Syarat',
    text: '',
    buttons: {
      agree: 'Saya setuju',
      disagree: 'Saya tidak setuju',
    },
    modal: {
      header: 'Apakah Anda yakin?',
      text:
        'Mohon dicatat bahwa apabila Anda tidak setuju dengan syarat dan ketentuan kami Anda tidak akan dapat menggunakan aplikasi Gold Wallet. Apakah Anda masih tidak menyetujui?',
      noButton: 'Tidak, Saya berubah pikiran.',
      yesButton: 'Ya, Saya tidak setuju.',
    },
  },
  aboutUs: {
    alwaysBackupYourKeys: 'Selalu cadangkan kunci Anda',
    buildWithAwesome: 'Bangun dengan hebat:',
    goToOurGithub: 'Masuk ke Github kami',
    header: 'Tentang kami',
    rateGoldWallet: 'Beri rating GoldWallet',
    releaseNotes: 'Catatan rilis',
    runSelfTest: 'Jalankan tes mandiri',
    title: 'GoldWallet adalah dompet Bitcoin Vault gratis dan sumber terbuka. Dilisensi MIT.',
  },
  advancedOptions: {
    description:
      'Mengaktifkan opsi Lanjutan akan memungkinkan Anda untuk memilih dari jenis dompet yang tercantum di bawah ini:\n  P2SH, HD P2SH, HD segwit.',
    title: 'Konfigurasikan opsi lanjutan',
  },
  authenticators: {
    add: {
      description:
        'Hal ini akan diperlukan untuk menyambungkan Gold Wallet dengan aplikasi desktop Electrum Vault. Ini digunakan sebagai autentikasi dua-faktor.',
      subdescription: 'Anda juga dapat mengimpor authenticator dengan memilih opsi di bawah.',
      subtitle: 'Buat authenticator baru',
      successDescription:
        'Tuliskan frasa benih ini di suatu tempat yang aman. Untuk berjaga-jaga seandainya Anda perlu memulihkan pengautentikasi. Ingat bahwa pengautentikasi diperlukan untuk mengonfirmasi transaksi Cepat dan Pembatalan.',
      successTitle: 'Authenticator Anda siap!',
      title: 'Tambahkan authenticator baru',
    },
    delete: {
      subtitle: 'Hapus authenticator Anda',
      success: 'Authenticator Anda berhasil dihapus. Anda selalu dapat membuat yang baru.',
      title: 'Hapus authenticator',
    },
    enterPIN: {
      description: 'Masukkan PIN ini ke dalam aplikasi desktop Electrum Vault untuk menyelesaikan proses penyandingan.',
      subtitle: 'Masukkan PIN',
    },
    errors: {
      noEmpty: 'Bidang tidak boleh kosong',
    },
    export: {
      title: 'Ekspor authenticator',
    },
    import: {
      code: 'Kode:',
      desc1: 'Tuliskan frasa benih atau pindai kode QR authenticator yang ingin Anda impor.',
      desc2: 'pindai kode QR dengan mengklik tombol “atau pindai kode QR” di bawah',
      inUseValidationError: 'Nama harus unik. Mohon masukkan nama yang valid.',
      mnemonicLength: 'Mnemonik harus teridiri dari 12 kata.',
      multipleQrCodesDescription:
        'Beberapa transaksi memiliki lebih dari 1 kode QR. Pastikan bahwa Anda telah memindai semua kode dari aplikasi Electrum Vault.',
      multipleQrCodesTitle: 'Pindai kode QR lain',
      scanNext: 'Pindai selanjutnya',
      subtitle: 'Impor authenticator Anda',
      success: 'Anda berhasil mengimpor authenticator. Authenticator kini siap digunakan.',
      textAreaPlaceholder: 'Frasa benih',
      title: 'Impor authenticator',
    },
    list: {
      noAuthenticators: 'Belum ada Authenticator',
      noAuthenticatorsDesc1: 'Ketuk',
      noAuthenticatorsDesc2: 'untuk menambahkan authenticator pertama Anda.',
      scan: 'Pindai',
      title: 'Authenticator Bitcoin Vault',
    },
    options: {
      delete: 'Hapus authenticator',
      export: 'Ekspor authenticator',
      pair: 'Sandingkan authenticator',
      sectionTitle: 'Umum',
      title: 'Opsi authenticator',
    },
    pair: {
      descPin: 'Gunakan PIN ini untuk mengonfirmasi penyandingan authenticator di aplikasi desktop.',
      descPublicKey:
        'Anda dapat menggunakan Kunci Publik ini untuk mengimpor authenticator di aplikasi desktop saat proses pembuatan dompet dengan opsi GoldWallet.',
      pin: 'PIN',
      publicKey: 'Kunci Publik',
      title: 'Sandingkan authenticator',
    },
    publicKey: {
      okButton: 'OK, Saya mengerti',
      subtitle:
        'Anda dapat menggunakan Kunci Publik ini untuk mengimpor autentikator Anda ke aplikasi desktop Electrum Vault selama proses pembuatan dompet 2FA.',
      title: 'Kunci Publik',
    },
    sign: {
      error: 'Tidak ada authenticator yang dapat menandatangani transaksi',
    },
  },
  betaVersion: {
    button: 'Saya mengerti dan menerima risikonya',
    description:
      'Aplikasi masih akan menjalani pengujian akhir sebelum perilisan resmi. Aplikasi mobile dan semua yang konten yang Anda temukan didalamnya disediakan dalam basis "apa adanya" dan "ketika tersedia". Risiko penggunaan perangkat lunak ditanggung langsung oleh pengguna.',
    title: 'Versi ini merupakan GoldWallet versi beta',
  },
  contactCreate: {
    addressLabel: 'Alamat',
    buttonLabel: 'Tambah kontak baru',
    description: 'Masukkan nama dan alamat\n  untuk kontak baru Anda.',
    nameCannotContainSpecialCharactersError: 'Nama tidak dapat mengandung karakter khusus.',
    nameLabel: 'Nama',
    nameMissingAlphanumericCharacterError: 'Nama tidak memiliki karakter alfanumerik.',
    screenTitle: 'Tambah kontak baru',
    subtitle: 'Kontak baru',
    successButton: 'Kembali ke Buku alamat',
    successDescription: 'Hore! Anda telah berhasil\n  menambahkan kontak.',
    successTitle: 'Berhasil',
  },
  contactDelete: {
    description1: 'Anda yakin ingin menghapus',
    description2: '?\n  Anda tidak dapat mengurungkannya.',
    header: 'Hapus kontak',
    no: 'Tidak',
    success: 'Berhasil',
    successButton: 'Kembali ke Buku alamat',
    successDescription: 'Kontak Anda berhasil dihapus.\n  Anda sekarang dapat kembali ke Buku alamat.',
    title: 'Hapus kontak Anda',
    yes: 'Ya',
  },
  contactDetails: {
    addressLabel: 'Alamat',
    deleteButton: 'Hapus kontak',
    editAddress: 'Edit alamat',
    editName: 'Edit nama',
    nameLabel: 'Nama',
    sendCoinsButton: 'Kirim koin',
    share: 'Bagikan',
    showQRCodeButton: 'Tampilkan kode QR',
  },
  contactList: {
    cancel: 'Batal',
    noContacts: 'Tidak ada kontak',
    noContactsDesc1: 'Tidak ada kontak untuk ditampilkan. \n  Klik',
    noContactsDesc2: 'untuk menambahkan kontak pertama Anda.',
    noResults: 'Tidak ada hasil untuk',
    screenTitle: 'Buku alamat',
    search: 'Cari',
  },
  electrumServer: {
    connectionError: 'Tidak dapat terhubung ke server Electrum yang tersedia',
    description:
      'Anda dapat merubah alamat server yang akan digunakan aplikasi Anda untuk menyambungkan diri. Alamat default direkomendasikan.',
    header: 'Server Electrum',
    host: 'host',
    port: 'port',
    save: 'Simpan',
    successfullSave: 'Perubahan Anda berhasil disimpan. Restart mungkin diperlukan supaya perubahan berlaku.',
    title: 'Ubah server electrum',
    useDefault: 'Gunakan default',
  },
  filterTransactions: {
    clearAll: 'Bersihkan semua',
    clearFilters: 'bersihkan filter',
    filter: 'filter',
    from: 'dari',
    fromAmount: 'Dari jumlah',
    fromDate: 'dari tanggal',
    header: 'filter transaksi',
    receive: 'terima',
    received: 'Diterima',
    send: 'kirim',
    sent: 'DIkirim',
    status: {
      canceled: 'Dibatalkan',
      canceledDone: 'Dibatalkan-selesai',
      done: 'Selesai',
      pending: 'Tertunda',
    },
    to: 'Ke',
    toAmount: 'Ke jumlah',
    toDate: 'Ke tanggal',
    transactionStatus: 'Status transaksi',
    transactionType: 'Tipe transaksi',
  },
  message: {
    allDone: 'Semua selesai!',
    bePatient: 'Harap bersabar. Mungkin perlu waktu.',
    cancelTxSuccess: 'Anda berhasil membatalkan transaksi.\n  Koin Anda akan tiba.',
    creatingAuthenticator: 'authenticator Anda sedang dibuat',
    creatingAuthenticatorDescription: 'Harap bersabar selagi kami membuat authenticator Anda.\n  Mungkin perlu waktu.',
    creatingWallet: 'Membuat dompet Anda',
    creatingWalletDescription:
      'Mohon kesabaran Anda sementara kami membuat dompet Anda. Ini mungkin membutuhkan waktu.',
    generateAddressesError: 'Tidak bisa membuat alamat',
    hooray: 'Hore!',
    importingAuthenticator: 'Mengimpor authenticator Anda',
    importingAuthenticatorDescription:
      'Harap bersabar selagi kami mengimpor authenticator Anda.\n  Mungkin perlu waktu.',
    noTransactions: 'Transaksi tidak ditemukan di dompet',
    noTransactionsDesc: 'Anda mungkin mencoba mengimpor dompet yang belum pernah digunakan',
    processing: 'Pengolahan',
    returnToAuthenticators: 'Kembali ke authenticator',
    returnToDashboard: 'Kembali ke Dasbor',
    returnToWalletChoose: 'Kembali ke pemilihan tipe dompet',
    returnToWalletImport: 'Kembali ke impor dompet',
    somethingWentWrong: 'Terjadi kesalahan',
    somethingWentWrongWhileCreatingWallet:
      'Terjadi kesalahan saat kami membuat dompet Anda. Silakan kembali ke Dasbor dan coba lagi.',
    success: 'Berhasil',
    successfullWalletDelete: 'Dompet Anda berhasil dihapus. Anda sekarang dapat kembali ke Dasbor.',
    successfullWalletImport: 'Dompet Anda berhasil diimpor. Anda sekarang dapat kembali ke Dasbor.',
    wrongMnemonic: 'Mnemonik salah',
    wrongMnemonicDesc:
      'Mnemonik tidak sesuai dengan dompet apa pun yang didukung. Anda mencoba mengimpor mnemonik yang tidak valid atau dompet belum pernah digunakan',
  },
  onboarding: {
    changePin: 'Ubah PIN',
    confirmNewPin: 'Konfirmasi PIN baru',
    confirmPassword: 'Konfirmasi sandi transaksi',
    confirmPin: 'Konfirmasi PIN',
    createNewPin: 'PIN Baru',
    createPassword: 'Buat sandi transaksi',
    createPasswordDescription:
      'Kata Sandi Transaksi Anda akan digunakan untuk memverifikasi semua transaksi. Anda tidak dapat melakukan perubahan setelah ini. Sandi Transaksi harus paling tidak terdiri dari 8 karakter alfanumerik.',
    createPin: 'Buat PIN',
    createPinDescription:
      'PIN Anda kan digunakan untuk masuk ke aplikasi. Anda dapat melakukan perubahan nanti di bagian pengaturan.',
    currentPin: 'PIN Sekarang',
    failedTimes: 'Percobaan gagal',
    failedTimesErrorInfo: 'Setelah tiga percobaan yang gagal, Anda akan diblokir masuk selama',
    goBack: 'Kembali',
    minutes: 'menit.',
    numberOfAttemptsExceeded: 'Jumlah percobaan terlampaui',
    onboarding: 'Onboarding',
    passwordDoesNotMatch: 'Kata sandi tidak cocok. Mohon masukkan kata sandi yang valid.',
    pin: 'PIN',
    pinDoesNotMatch: 'PIN tidak cocok. Mohon masukkan PIN yang valid.',
    seconds: 'detik',
    successButton: 'Pergi ke Dasbor',
    successButtonChangedPin: 'Kembali ke Pengaturan',
    successDescription: 'Hore!\n  PIN Anda telah berhasil dibuat.',
    successDescriptionChangedPin: 'Hore!\n  PIN Anda telah berhasil dirubah.',
    tryAgain: 'Coba lagi setelah',
  },
  receive: {
    details: {
      amount: 'Jumlah',
      receiveWithAmount: 'Terima dengan jumlah',
      receiveWithAmountSubtitle:
        'Masukkan jumlah yang ingin Anda terima. Kode QR akan diperbarui sesuai dengan jumlah yang Anda masukkan.',
      share: 'Bagikan',
      shareWalletAddress: 'Bagikan alamat dompet',
    },
    header: 'Terima koin',
    label: 'Alamat dompet',
  },
  scanQrCode: {
    cancel: 'Batal',
    ok: 'Ok',
    permissionMessage: 'Kami membutuhkan izin Anda untuk menggunakan kamera',
    permissionTitle: 'Izin untuk menggunakan kamera',
  },
  security: {
    jailBrokenPhone:
      'Perangkat Anda tampak sudah di-jailbreak. Ini dapat menyebabkan masalah keamanan, kerusakan, atau masalah lainnya. Kami tidak menyarankan penggunaan GoldWallet di perangkat yang sudah di-jailbreak.',
    noPinOrFingerprintSet:
      'Nampaknya perangkat Anda tidak diamankan menggunakan PIN ataupun sidik jari. Kami tidak merekomendasikan untuk menggunakan GoldWallet di perangkat yang tidak diamankan.',
    rootedPhone:
      'Perangkat Anda tampaknya sudah di-root. Ini dapat menyebabkan masalah keamanan, kerusakan, atau masalah lainnya. Kami tidak menyarankan penggunaan GoldWallet di perangkat yang sudah di-root.',
    title: 'Masalah keamanan',
  },
  selectLanguage: {
    alertDescription: 'Pilih bahasa dan mulai ulang aplikasi?',
    cancel: 'Batal',
    confirm: 'Konfirmasi',
    confirmation: 'Konfirmasi',
    header: 'Bahasa',
    restartInfo:
      'Saat memilih bahasa baru, mungkin dibutuhkan pemulaian ulang/restart GoldWallet agar perubahan berlaku',
  },
  send: {
    confirm: {
      availableBalance: 'Saldo tersedia setelah transaksi',
      cancelNow: 'Batalkan sekarang',
      pendingBalance: 'Saldo tertunda setelah transaksi',
      sendNow: 'Kirim sekarang',
    },
    create: {
      amount: 'Jumlah',
      fee: 'Biaya',
      headerText:
        'Jika ada sejumlah besar transaksi tertunda di jaringan (>1500), biaya lebih tinggi akan membuat transaksi Anda diproses lebih cepat. Nilai biasanya adalah 1-500 sat/b',
      setTransactionFee: 'Atur biaya transaksi',
    },
    details: {
      address: 'alamat',
      address_field_is_not_valid: 'Bidang alamat tidak valid',
      amount_field_is_not_valid: 'Bidang jumlah tidak valid',
      amount_placeholder: 'jumlah yang dikirimkan (dalam BTCV)',
      cancel: 'Batal',
      create: 'Buat Faktur',
      create_tx_error: 'Terjadi kesalahan saat membuat transaksi. Harap pastikan alamat valid.',
      fee: 'Biaya:',
      fee_field_is_not_valid: 'Bidang biaya tidak valid',
      fee_placeholder: 'plus biaya transaksi (dalam BTCV)',
      feeUnit: 'Sat/B',
      next: 'Berikutnya',
      note: 'Catatan (opsional)',
      note_placeholder: 'catatan untuk diri sendiri',
      remaining_balance: 'Sisa saldo',
      scan: 'Pindai',
      send: 'Kirim',
      title: 'buat transaksi',
      to: 'ke',
      total_exceeds_balance: 'Jumlah pengiriman melebihi sisa saldo.',
    },
    error: {
      description: 'Sebelum melakukan transaksi, Anda harus menambahkan dompet Bitcoin Vault terlebih dahulu.',
      title: 'Kesalahan',
    },
    header: 'Kirim koin',
    recovery: {
      confirmFirstSeed: 'Konfirmasi dengan Frasa Benih Pembatalan',
      confirmFirstSeedDesc:
        'Buka dokumen PDF pertama yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
      confirmSecondSeed: 'Konfirmasi dengan Frasa Benih Cepat',
      confirmSecondSeedDesc:
        'Buka dokumen PDF kedua yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
      confirmSeed: 'Konfirmasi dengan Frasa Benih Pembatalan',
      confirmSeedDesc:
        'Buka dokumen PDF yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
      recover: 'Batal',
      useWalletAddress: 'Gunakan alamat dompet ini',
    },
    success: {
      description: 'Hore! Anda berhasil menyelesaikan transaksi.',
      done: 'Selesai',
      return: 'Kembali ke Dasbor',
      title: 'Berhasil',
    },
    transaction: {
      alert: 'Aman',
      alertDesc:
        'Transaksi ini perlu 144 blok atau sekitar 24 jam untuk dikonfirmasi. Anda dapat membatalkannya selama waktu ini.',
      fastSuccess: 'Anda berhasil membuat transaksi cepat.',
      instant: 'Cepat Aman',
      instantDesc: 'Transaksi ini akan segera dikonfirmasi. Gunakan dengan sangat hati-hati.',
      lightningError:
        'Alamat ini tampaknya merupakan faktur Lightning. Buka dompet Lightning Anda untuk melakukan pembayaran untuk faktur ini.',
      scanInstantKeyDesc:
        'Buka dokumen PDF yang Anda buat saat membuat dompet, lalu pindai kode QR Kunci Privat untuk mengirim transaksi.',
      scanInstantKeyTitle: 'Pindai Kunci Cepat',
      type: 'Tipe transaksi',
      watchOnlyError: 'Dompet lihat saja/watch only tidak dapat mengirim transaksi',
    },
    warning: 'Peringatan:',
    warningGeneral:
      'Peringatan: Mohon diingat bahwa dalam proses menggunakan fitur Transaksi Aman, sebagian dari saldo yang tersisa di saldo dompet Anda memilki kemungkinan untuk diblokir secara sementara. Hal ini merupakan bagian dari prosedur umum yang berkaitan dengan UTXO dan parameter blockchain dari dompet Bitcoin Vault. Saldo Anda akan kembali dibuka ketika transaksi Anda diverifikasi (kurang lebih setelah sekitar 24 jam) atau dibatalkan (dalam waktu 24 jam).',
  },
  settings: {
    about: 'Tentang',
    aboutUs: 'Tentang kami',
    advancedOptions: 'Opsi lanjutan',
    Biometrics: 'Ijinkan penggunaan biometrik',
    changePin: 'Ubah PIN',
    electrumServer: 'Server Electrum',
    FaceID: 'Ijinkan penggunaan FaceID',
    fingerprintLogin: 'Login sidik jari',
    general: 'Umum',
    header: 'Pengaturan',
    language: 'Bahasa',
    notSupportedFingerPrint: 'Perangkat anda tidak mendukung pemindai sidik jari',
    security: 'Keamanan',
    TouchID: 'Ijinkan penggunaan sidik jari',
  },
  tabNavigator: {
    addressBook: 'Buku alamat',
    authenticators: 'Authenticator',
    settings: 'Pengaturan',
    wallets: 'Dompet',
  },
  timeCounter: {
    closeTheApp: 'Tutup aplikasi',
    description:
      'Aplikasi Anda telah diblokir karena percobaan masuk yang tidak berhasil. Tunggu selama waktu yang dibutuhkan untuk mencoba lagi.',
    title: 'Aplikasi diblokir',
    tryAgain: 'Coba lagi',
  },
  transactions: {
    details: {
      addNote: 'Tambah catatan',
      addToAddressBook: 'Tambahkan ke buku Alamat',
      amount: 'Jumlah',
      blocked: 'Diblokir',
      bytes: 'byte',
      confirmations: 'konfirmasi',
      copy: 'Salin',
      copyAndBoriadcast: 'Salin dan siarkan nanti',
      details: 'Detail',
      detailTitle: 'Detail transaksi',
      fee: 'Biaya',
      from: 'Dari',
      inputs: 'Input',
      noLabel: 'Tidak ada label',
      note: 'Catatan',
      numberOfCancelTransactions: 'Jumlah Transaksi Pembatalan',
      ouputs: 'Output',
      returnedFee: 'Biaya yang dikembalikan:',
      satoshiPerByte: 'Satoshi per byte',
      sendCoins: 'Kirim koin',
      timePending: 'Waktu tertunda',
      title: 'Transaksi',
      to: 'Ke',
      toExternalWallet: 'Ke dompet external',
      toInternalWallet: 'Ke dompet internal',
      totalReturnedFee: 'Total biaya yang dikembalikan:',
      transactioFee: 'Biaya transaksi',
      transactionDetails: 'Detail transaksi',
      transactionHex: 'Hex transaksi',
      transactionHexDescription: 'Ini adalah hex transaksi, ditandatangani dan siap disiarkan ke jaringan',
      transactionId: 'ID Transaksi',
      transactionType: 'Tipe transaksi',
      txSize: 'Ukuran TX',
      unblocked: 'Dibuka',
      verify: 'Verifikasi di coinb.in',
      viewInBlockRxplorer: 'Lihat di block explorer',
      walletType: 'Tipe dompet',
    },
    errors: {
      notEnoughBalance: 'Saldo tidak cukup. Mohon coba untuk mengirimkan jumlah yang lebih sedikit.',
    },
    label: {
      blocked: 'Diblokir',
      canceled: 'dibatalkan',
      canceledDone: 'Dibatalkan - selesai',
      done: 'selesai',
      pending: 'tertunda',
      unblocked: 'unblocked',
    },
    list: {
      conf: 'Konfirmasi',
    },
    transactionTypeLabel: {
      canceled: 'Dibatalkan',
      secure: 'Aman',
      secureFast: 'Aman Cepat',
      standard: 'Standar',
    },
  },
  unlock: {
    confirmButton: 'Konfirmasi sidik jari Anda untuk melanjutkan.',
    enter: 'Masukkan PIN',
    title: 'Buka Kunci',
    touchID: 'Touch ID untuk "Gold Wallet"',
  },
  unlockTransaction: {
    description: 'Konfirmasi Kata Sandi Transaksi untuk melanjutkan transaksi.',
    headerText: 'Konfirmasi transaksi',
    title: 'Konfirmasi Transaksi',
  },
  wallets: {
    add: {
      addWalletButton: 'Tambah dompet baru',
      advancedOptions: 'Opsi lanjutan',
      air: 'Membuat transaksi Standar, Pembatalan, dan Cepat.',
      ar: 'Membuat transaksi Standar dan Pembatalan.',
      description: 'Masukkan nama untuk dompet baru Anda.',
      failed: 'Gagal membuat dompet',
      importWalletButton: 'Impor dompet',
      inputLabel: 'Nama',
      legacy: 'Membuat tipe transaksi default.',
      legacyHDP2SH: 'Berisi pohon alamat P2SH yang dibuat dari satu benih 12 kata',
      legacyHDP2SHTitle: 'HD P2SH Standar',
      LegacyHDSegWit: 'Berisi pohon alamat segwit asal, dibuat satu benih 12 kata',
      legacyHDSegWitTitle: 'HD Segwit Standar',
      LegacyP2SH: 'Berisi satu alamat P2SH',
      legacyP2SHTitle: 'P2SH Standar',
      legacyTitle: 'Standar',
      multipleAddresses: 'Mengandung sebuah pohon alamat P2SH dari sebuah seed satuan 12-kata',
      publicKeyError: 'Kunci publik yang disediakan tidak valid',
      segwidAddress:
        'Alamat ini mengandung sebuah pohon dari alamat segwit native, yang dihasilkan oleh sebuah benih tunggal 12-kata',
      singleAddress: 'Mengandung satu alamat P2SH',
      subtitle: 'Namai dompet Anda',
      title: 'Tambah dompet baru',
      walletType: 'Tipe dompet',
    },
    addSuccess: {
      description:
        'Dompet Anda telah dibuat. Luangkan waktu sebentar untuk menulis frasa mnemonik ini di selembar kertas sebagai cadangan/backup. Anda dapat menggunakannya untuk memulihkan dompet di perangkat lain.',
      okButton: 'Oke, saya sudah menuliskannya!',
      subtitle: 'Dompet Anda sudah siap!\n\nDopet Anda telah dibuat!',
      title: 'Tambah dompet baru',
    },
    dashboard: {
      allWallets: 'Semua Dompet',
      availableBalance: 'Saldo tersedia',
      noTransactions: 'Tidak ada transaksi untuk ditampilkan.',
      noWallets: 'Tidak ada dompet',
      noWalletsDesc1: 'Tidak ada dompet untuk ditampilkan.',
      noWalletsDesc2: 'untuk menambahkan dompet pertama Anda.',
      receive: 'Terima koin',
      recover: 'Batal',
      send: 'Kirim',
      title: 'Dompet',
      wallet: 'dompet',
    },
    deleteWallet: {
      description1: 'Anda yakin ingin menghapus',
      description2: '? Anda tidak dapat mengurungkannya.',
      header: 'Hapus dompet',
      no: 'Tidak',
      title: 'Hapus dompet Anda',
      yes: 'Ya',
    },
    details: {
      deleteWallet: 'Hapus dompet',
      details: 'Detail',
      edit: 'Ubah',
      exportWallet: 'Ekspor dompet',
      latestTransaction: 'Transaksi terakhir',
      nameEdit: 'Edit nama',
      nameLabel: 'Nama',
      showWalletXPUB: 'Tampilkan Dompet XPUB',
      typeLabel: 'Tipe',
    },
    errors: {
      duplicatedPublicKey: 'Kunci publik sudah ditambahkan',
      invalidMnemonic: 'Mnemonik tidak valid',
      invalidMnemonicWordsNumber: '{receivedWordsNumber} kata yang diberikan mengharapkan {expectedWordsNumber}',
      invalidPrivateKey: 'Kunci privat tidak valid',
      invalidPublicKey: 'Kunci publik tidak valid',
      invalidQrCode: 'Kode QR tidak valid',
      invalidSign: 'Tidak bisa menandatangani transaksi',
      noIndexForWord: 'Tidak bisa menemukan indeks untuk kata: {word}',
    },
    export: {
      title: 'ekspor dompet',
    },
    exportWallet: {
      header: 'Ekspor dompet',
      title: 'Frasa seed',
    },
    exportWalletXpub: {
      header: 'Dompet XPUB',
    },
    import: {
      do_import: 'Impor',
      error: 'Gagal mengimpor. Harap pastikan data yang diberikan valid.',
      explanation:
        'Tuliskan di sini mnemonik, kunci privat, WIF, atau apa pun yang Anda punya. GoldWallet akan berusaha sebaik mungkin untuk menebak format yang tepat dan mengimpor dompet Anda',
      imported: 'Diimpor',
      scan_qr: 'atau pindai kode QR?',
      success: 'Berhasil',
      title: 'impor',
    },
    importWallet: {
      chooseTypeDescription: 'Pilih jenis dompet yang ingin Anda impor.',
      customWords: 'Kata-kata buatan (custom)',
      extendWithCustomWords: 'Perpanjang seed ini dengan kata-kata buatan',
      header: 'Impor dompet',
      import: 'Impor',
      importARDescription1: 'Masukkan frasa benih (seed)',
      importARDescription2: 'pindai kode QR dompet yang ingin Anda impor',
      placeholder: 'Frasa benih (seed)',
      scanCancelPubKey: 'Pindai kode QR Kunci Pembatalan',
      scanFastPubKey: 'Pindai kode QR Kunci Cepat',
      scanPublicKeyDescription:
        'Buka dokumen PDF pertama yang Anda buat saat Anda membuat dompet yang ingin diimpor, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik.',
      scanQrCode: 'atau pindai kode QR',
      scanWalletAddress: 'Pindai alamat dompet',
      scanWalletAddressDescription: 'Pindai kode QR Alamat Publik untuk memulai integrasi dengan GoldWallet.',
      subtitle:
        'Tuliskan di sini mnemonik, kunci privat, WIF, atau apa pun yang Anda punya. GoldWallet akan berusaha sebaik mungkin untuk menebak format yang tepat dan mengimpor dompet Anda.',
      title: 'Impor dompet Anda',
      unsupportedElectrumVaultMnemonic:
        'Benih ini berasal dari Electrum Vault dan belum didukung. Akan didukung di masa yang akan datang.',
      walletInUseValidationError: 'Dompet sudah digunakan. Masukkan dompet yang valid.',
      allWalletsValidationError: 'Anda tidak bisa memasukkan nama "Semua dompet"',
    },
    publicKey: {
      instantDescription:
        'Buka Pembuat Kunci web di perangkat terpisah, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik. Mohon untuk mengekspor kunci Anda sebagai PDF!',
      instantSubtitle: 'Tambahkan Kunci Cepat',
      recoveryDescription:
        'Buka Pembuat Kunci web di perangkat terpisah, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik. Mohon untuk mengekspor kunci Anda sebagai PDF!',
      recoverySubtitle: 'Tambahkan Kunci Pembatalan',
      scan: 'Pindai',
      webKeyGenerator: 'Pembuat Kunci Web:',
    },
    scanQrWif: {
      bad_password: 'Kata sandi buruk',
      bad_wif: 'WIF buruk',
      cancel: 'Batal',
      decoding: 'Mendekode',
      go_back: 'Kembali',
      imported_legacy: 'Legacy diimpor',
      imported_segwit: 'SegWit diimpor',
      imported_watchonly: 'Watch-only diimpor',
      imported_wif: 'WIF diimpor',
      input_password: 'Masukkan kata sandi',
      password_explain: 'Ini adalah kunci privat terenkripsi BIP38',
      wallet_already_exists: 'Dompet tersebut sudah ada',
      with_address: 'dengan alamat',
    },
    wallet: {
      latest: 'Transaksi terakhir',
      none: 'Tidak ada',
      pendingBalance: 'Saldo tertunda',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Dompet',
    },
  },
};
