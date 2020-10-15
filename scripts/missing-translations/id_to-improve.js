const id = {
  _: {
    languageCode: 'id',
    storage_is_encrypted: 'Penyimpanan Anda dienkripsi. Perlu kata sandi untuk mendekripsinya',
    enter_password: 'Masukkan kata sandi',
    bad_password: 'Kata sandi buruk, coba lagi',
    never: 'tidak pernah',
    continue: 'Lanjutkan',
    ok: 'OK',
    click: 'Klik',
    here: 'Disini',
    save: 'Simpan',
    confirm: 'Konfirmasi',
    copy: 'Salin',
    copied: 'Disalin!',
    or: 'atau',
    delete: 'Hapus',
    created: 'Dibuat pada',
    invalid: 'Tidak Valid',
    satoshi: 'Satoshi',
    next: 'Berikutnya',
  },
  tabNavigator: {
    dashboard: 'Dasbor',
    settings: 'Pengaturan',
    addressBook: 'Buku alamat',
    wallets: 'Dompet',
    authenticators: 'Authenticator',
  },
  message: {
    somethingWentWrong: 'Terjadi kesalahan',
    somethingWentWrongWhileCreatingWallet: 'Terjadi kesalahan saat kami membuat dompet Anda. Silakan kembali ke Dasbor dan coba lagi.',
    success: 'Berhasil',
    successfullWalletImport: 'Dompet Anda berhasil diimpor. Anda sekarang dapat kembali ke Dasbor.',
    successfullWalletDelete: 'Dompet Anda berhasil dihapus. Anda sekarang dapat kembali ke Dasbor.',
    returnToDashboard: 'Kembali ke Dasbor',
    creatingWallet: 'Membuat dompet Anda',
    creatingWalletDescription: 'Mohon kesabaran Anda sementara kami membuat dompet Anda. Ini mungkin membutuhkan waktu.',
    allDone: 'Semua selesai!',
    hooray: 'Hore!',
    cancelTxSuccess: 'Anda berhasil membatalkan transaksi.\n Koin Anda akan tiba.',
    wrongMnemonic: 'Mnemonik salah',
    wrongMnemonicDesc: 'Mnemonik tidak sesuai dengan dompet apa pun yang didukung. Anda mencoba mengimpor mnemonik yang tidak valid atau dompet belum pernah digunakan',
    returnToWalletChoose: 'Kembali ke pemilihan tipe dompet',
    returnToWalletImport: 'Kembali ke impor dompet',
    generateAddressesError: 'Tidak bisa membuat alamat',
    noTransactions: 'Transaksi tidak ditemukan di dompet',
    noTransactionsDesc: 'Anda mungkin mencoba mengimpor dompet yang belum pernah digunakan',
    returnToAuthenticators: 'Kembali ke authenticator',
    creatingAuthenticator: 'authenticator Anda sedang dibuat',
    creatingAuthenticatorDescription: 'Harap bersabar selagi kami membuat authenticator Anda.\n Mungkin perlu waktu.',
    importingAuthenticator: 'Mengimpor authenticator Anda',
    importingAuthenticatorDescription: 'Harap bersabar selagi kami mengimpor authenticator Anda.\n Mungkin perlu waktu.',
  },
  onboarding: {
    onboarding: 'Onboarding',
    pin: 'PIN',
    createPin: 'Buat PIN',
    createNewPin: 'PIN Baru',
    createPassword: 'Buat sandi transaksi',
    createPinDescription: 'PIN Anda kan digunakan untuk masuk ke aplikasi. Anda dapat melakukan perubahan nanti di bagian pengaturan.',
    confirmPin: 'Konfirmasi PIN',
    confirmNewPin: 'Konfirmasi PIN baru',
    confirmPassword: 'Konfirmasi sandi transaksi',
    passwordDoesNotMatch: 'Kata sandi tidak cocok. Mohon masukkan kata sandi yang valid.',
    createPasswordDescription: 'Kata Sandi Transaksi Anda akan digunakan untuk memverifikasi semua transaksi. Anda tidak dapat melakukan perubahan setelah ini. Sandi Transaksi harus paling tidak terdiri dari 8 karakter alfanumerik.',
    changePin: 'Ubah PIN',
    currentPin: 'PIN Sekarang',
    pinDoesNotMatch: 'PIN tidak cocok. Mohon masukkan PIN yang valid.',
    successDescription: 'Hore!\n PIN Anda telah berhasil dibuat.',
    successDescriptionChangedPin: 'Hore!\n PIN Anda telah berhasil dirubah.',
    successButton: 'Pergi ke Dasbor',
    successButtonChangedPin: 'Kembali ke Pengaturan',
    failedTimes: 'Percobaan gagal',
    failedTimesErrorInfo: 'Setelah tiga percobaan yang gagal, Anda akan diblokir masuk selama',
    goBack: 'Kembali',
    minutes: 'menit.',
    numberOfAttemptsExceeded: 'Jumlah percobaan terlampaui',
    seconds: 'detik',
    tryAgain: 'Coba lagi setelah',
  },
  unlock: {
    title: 'Buka Kunci',
    touchID: 'Touch ID untuk \"Gold Wallet\"',
    confirmButton: 'Konfirmasi sidik jari Anda untuk melanjutkan.',
    enter: 'Masukkan PIN',
  },
  unlockTransaction: {
    headerText: 'Konfirmasi transaksi',
    title: 'Konfirmasi Kata Sandi Transaksi',
    description: 'Konfirmasi Kata Sandi Transaksi untuk melanjutkan transaksi.',
  },
  wallets: {
    dashboard: {
      title: 'Dompet',
      allWallets: 'Semua Dompet',
      noWallets: 'Tidak ada dompet',
      noWalletsDesc1: 'Tidak ada dompet untuk ditampilkan.',
      noWalletsDesc2: 'untuk menambahkan dompet pertama Anda.',
      send: 'Kirim koin',
      receive: 'Terima koin',
      noTransactions: 'Tidak ada transaksi untuk ditampilkan.',
      availableBalance: 'Saldo tersedia',
      wallet: 'dompet',
      recover: 'Batal',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'Dompet',
    },
    importWallet: {
      title: 'Impor dompet Anda',
      header: 'Impor dompet',
      subtitle: 'Tuliskan di sini mnemonik, kunci privat, WIF, atau apa pun yang Anda punya. GoldWallet akan berusaha sebaik mungkin untuk menebak format yang tepat dan mengimpor dompet Anda.',
      placeholder: 'Mnemonik, kunci pribadi, WIF',
      import: 'Impor',
      scanQrCode: 'atau pindai kode QR',
      walletInUseValidationError: 'Dompet sudah digunakan. Masukkan dompet yang valid.',
      chooseTypeDescription: 'Pilih jenis dompet yang ingin Anda impor.',
      importARDescription1: 'Masukkan frasa benih (seed)',
      importARDescription2: 'pindai kode QR dompet yang ingin Anda impor',
      scanWalletAddress: 'Pindai alamat dompet',
      scanWalletAddressDescription: 'Pindai kode QR Alamat Publik untuk memulai integrasi dengan GoldWallet.',
      scanFastPubKey: 'Pindai kode QR Kunci Cepat',
      scanCancelPubKey: 'Pindai kode QR Kunci Pembatalan',
      scanPublicKeyDescription: 'Buka dokumen PDF pertama yang Anda buat saat Anda membuat dompet yang ingin diimpor, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik.',
      unsupportedElectrumVaultMnemonic: 'Benih ini berasal dari Electrum Vault dan belum didukung. Akan didukung di masa yang akan datang.',
    },
    exportWallet: {
      title: 'Frasa mnemonik',
      header: 'Ekspor dompet',
    },
    exportWalletXpub: {
      header: 'Dompet XPUB',
    },
    deleteWallet: {
      title: 'Hapus dompet Anda',
      header: 'Hapus dompet',
      description1: 'Anda yakin ingin menghapus',
      description2: '? Anda tidak dapat mengurungkannya.',
      no: 'Tidak',
      yes: 'Ya',
    },
    wallet: {
      none: 'Tidak ada',
      latest: 'Transaksi terakhir',
      pendingBalance: 'Saldo tertunda',
    },
    add: {
      title: 'Tambah dompet baru',
      subtitle: 'Namai dompet Anda',
      description: 'Masukkan nama untuk dompet baru Anda.',
      inputLabel: 'Nama',
      addWalletButton: 'Tambah dompet baru',
      importWalletButton: 'Impor dompet',
      advancedOptions: 'Opsi lanjutan',
      multipleAddresses: 'Beberapa alamat',
      singleAddress: 'Satu alamat',
      segwidAddress: 'Alamat ini mengandung sebuah pohon dari alamat segwit native, yang dihasilkan oleh sebuah benih tunggal 24-kata',
      failed: 'Gagal membuat dompet',
      walletType: 'Tipe dompet',
      ar: 'Membuat transaksi Standar dan Pembatalan.',
      air: 'Membuat transaksi Standar, Pembatalan, dan Cepat.',
      legacyTitle: 'Legasi',
      legacyHDP2SHTitle: 'HD P2SH Legasi',
      legacyP2SHTitle: 'P2SH Legasi',
      legacyHDSegWitTitle: 'HD Segwit Legasi',
      legacy: 'Membuat tipe transaksi default.',
      legacyHDP2SH: 'Berisi pohon alamat P2SH yang dibuat dari satu benih 24 kata',
      LegacyP2SH: 'Berisi satu alamat P2SH',
      LegacyHDSegWit: 'Berisi pohon alamat segwit asal, dibuat satu benih 24 kata',
      publicKeyError: 'Kunci publik yang disediakan tidak valid',
    },
    addSuccess: {
      title: 'Tambah dompet baru',
      subtitle: 'Berhasil',
      description: 'Dompet Anda telah dibuat. Luangkan waktu sebentar untuk menulis frasa mnemonik ini di selembar kertas. Untuk berjaga-jaga. Anda dapat menggunakannya untuk memulihkan dompet di perangkat lain.',
      okButton: 'Oke, saya sudah menuliskannya!',
    },
    details: {
      edit: 'Ubah',
      latestTransaction: 'Transaksi terakhir',
      typeLabel: 'Tipe',
      nameLabel: 'Nama',
      exportWallet: 'Ekspor dompet',
      showWalletXPUB: 'Tampilkan Dompet XPUB',
      deleteWallet: 'Hapus dompet',
      nameEdit: 'Edit nama',
      details: 'TRANSLATION NEEDED | ENG: Details',
    },
    export: {
      title: 'ekspor dompet',
    },
    import: {
      title: 'impor',
      explanation: 'Tuliskan di sini mnemonik, kunci privat, WIF, atau apa pun yang Anda punya. GoldWallet akan berusaha sebaik mungkin untuk menebak format yang tepat dan mengimpor dompet Anda',
      imported: 'Diimpor',
      error: 'Gagal mengimpor. Harap pastikan data yang diberikan valid.',
      success: 'Berhasil',
      do_import: 'Impor',
      scan_qr: 'atau pindai kode QR?',
    },
    scanQrWif: {
      go_back: 'Kembali',
      cancel: 'Batal',
      decoding: 'Mendekode',
      input_password: 'Masukkan kata sandi',
      password_explain: 'Ini adalah kunci privat terenkripsi BIP38',
      bad_password: 'Kata sandi buruk',
      wallet_already_exists: 'Dompet tersebut sudah ada',
      bad_wif: 'WIF buruk',
      imported_wif: 'WIF diimpor',
      with_address: 'dengan alamat',
      imported_segwit: 'SegWit diimpor',
      imported_legacy: 'Legacy diimpor',
      imported_watchonly: 'Watch-only diimpor',
    },
    publicKey: {
      recoverySubtitle: 'Tambahkan Kunci Pembatalan',
      webKeyGenerator: 'Pembuat Kunci Web:',
      recoveryDescription: 'Buka Pembuat Kunci web di perangkat terpisah, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik. Mohon untuk mengekspor kunci Anda sebagai PDF!',
      instantSubtitle: 'Tambahkan Kunci Cepat',
      instantDescription: 'Buka Pembuat Kunci web di perangkat terpisah, lalu gunakan aplikasi ini untuk memindai kode QR Kunci Publik. Mohon untuk mengekspor kunci Anda sebagai PDF!',
      scan: 'Pindai',
    },
    errors: {
      invalidMnemonicWordsNumber: '{receivedWordsNumber} kata yang diberikan mengharapkan {expectedWordsNumber}',
      noIndexForWord: 'Tidak bisa menemukan indeks untuk kata: {word}',
      invalidPrivateKey: 'Kunci privat tidak valid',
      invalidPublicKey: 'Kunci publik tidak valid',
      invalidMnemonic: 'Mnemonik tidak valid',
      invalidQrCode: 'Kode QR tidak valid',
      invalidSign: 'Tidak bisa menandatangani transaksi',
      duplicatedPublicKey: 'Kunci publik sudah ditambahkan',
    },
  },
  transactions: {
    list: {
      conf: 'Konfirmasi',
    },
    details: {
      title: 'Transaksi',
      detailTitle: 'Detail transaksi',
      transactionHex: 'Hex transaksi',
      transactionHexDescription: 'Ini adalah hex transaksi, ditandatangani dan siap disiarkan ke jaringan',
      copyAndBoriadcast: 'Salin dan siarkan nanti',
      verify: 'Verifikasi di coinb.in',
      amount: 'Jumlah',
      fee: 'Biaya',
      txSize: 'Ukuran TX',
      satoshiPerByte: 'Satoshi per byte',
      from: 'Dari',
      to: 'Ke',
      bytes: 'byte',
      copy: 'Salin',
      noLabel: 'Tidak ada label',
      details: 'Detail',
      transactionId: 'ID Transaksi',
      confirmations: 'konfirmasi',
      transactionDetails: 'Detail transaksi',
      viewInBlockRxplorer: 'Lihat di block explorer',
      addNote: 'Tambah catatan',
      note: 'Catatan',
      inputs: 'Input',
      ouputs: 'Output',
      sendCoins: 'Kirim koin',
      transactionType: 'Tipe transaksi',
      transactioFee: 'Biaya transaksi',
      walletType: 'Tipe dompet',
      addToAddressBook: 'Tambahkan ke buku Alamat',
      timePending: 'Waktu tertunda',
    },
    label: {
      pending: 'tertunda',
      annulled: 'dianulir',
      done: 'selesai',
      canceled: 'dibatalkan',
      unblocked: 'unblocked',
    },
    transactionTypeLabel: {
      standard: 'Standar',
      canceled: 'Dibatalkan',
      fast: 'Cepat',
      secure: 'Aman',
      secureFast: 'Aman Cepat',
    },
    errors: {
      notEnoughBalance: 'Saldo tidak cukup. Mohon coba untuk mengirimkan jumlah yang lebih sedikit.',
    },
  },
  send: {
    header: 'Kirim koin',
    success: {
      title: 'Berhasil',
      description: 'Hore! Anda berhasil menyelesaikan transaksi.',
      done: 'Selesai',
      return: 'Kembali ke Dasbor',
    },
    details: {
      title: 'buat transaksi',
      amount_field_is_not_valid: 'Bidang jumlah tidak valid',
      fee_field_is_not_valid: 'Bidang biaya tidak valid',
      address_field_is_not_valid: 'Bidang alamat tidak valid',
      create_tx_error: 'Ada kesalahan saat membuat transaksi. Harap pastikan alamat valid.',
      address: 'alamat',
      amount_placeholder: 'jumlah yang dikirimkan (dalam BTCV)',
      fee_placeholder: 'plus biaya transaksi (dalam BTCV)',
      note_placeholder: 'catatan untuk diri sendiri',
      cancel: 'Batal',
      scan: 'Pindai',
      send: 'Kirim',
      next: 'Berikutnya',
      note: 'Catatan (opsional)',
      to: 'ke',
      feeUnit: 'Sat/B',
      fee: 'Biaya:',
      create: 'Buat Faktur',
      remaining_balance: 'Sisa saldo',
      total_exceeds_balance: 'Jumlah pengiriman melebihi sisa saldo.',
    },
    confirm: {
      sendNow: 'Kirim sekarang',
      cancelNow: 'Batalkan sekarang',
      availableBalance: 'Saldo tersedia setelah transaksi',
      pendingBalance: 'Saldo tertunda setelah transaksi',
    },
    create: {
      amount: 'Jumlah',
      fee: 'Biaya',
      setTransactionFee: 'Atur biaya transaksi',
      headerText: 'Jika ada sejumlah besar transaksi tertunda di jaringan (>1500), biaya lebih tinggi akan membuat transaksi Anda diproses lebih cepat. Nilai biasanya adalah 1-500 sat/b',
    },
    recovery: {
      recover: 'Batal',
      useWalletAddress: 'Gunakan alamat dompet ini',
      confirmSeed: 'Konfirmasi dengan Frasa Benih Pembatalan',
      confirmSeedDesc: 'Buka dokumen PDF yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
      confirmFirstSeed: 'Konfirmasi dengan Frasa Benih Pembatalan',
      confirmFirstSeedDesc: 'Buka dokumen PDF pertama yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
      confirmSecondSeed: 'Konfirmasi dengan Frasa Benih Cepat',
      confirmSecondSeedDesc: 'Buka dokumen PDF kedua yang Anda buat saat membuat dompet, lalu tuliskan frasa benih Kunci Privat dengan urutan yang sama.',
    },
    transaction: {
      instant: 'Cepat',
      instantDesc: 'Transaksi ini akan segera dikonfirmasi. Gunakan dengan hati-hati.',
      fastSuccess: 'Anda berhasil membuat transaksi cepat.',
      alert: 'Standar',
      alertDesc: 'Transaksi ini perlu 144 blok atau sekitar 24 jam untuk dikonfirmasi. Anda dapat membatalkannya selama waktu ini.',
      type: 'Tipe transaksi',
      scanInstantKeyTitle: 'Pindai Kunci Cepat',
      scanInstantKeyDesc: 'Buka dokumen PDF yang Anda buat saat membuat dompet, lalu pindai kode QR Kunci Privat untuk mengirim transaksi.',
      lightningError: 'Alamat ini tampaknya merupakan faktur Lightning. Buka dompet Lightning Anda untuk melakukan pembayaran untuk faktur ini.',
      watchOnlyError: 'Dompet lihat saja tidak dapat mengirim transaksi',
    },
    error: {
      title: 'Kesalahan',
      description: 'Sebelum melakukan transaksi, Anda harus menambahkan dompet Bitcoin Vault terlebih dahulu.',
    },
    warning: 'Peringatan: ',
    warningGeneral: 'Peringatan: Mohon diingat bahwa dalam proses menggunakan fitur Transaksi Aman, sebagian dari saldo yang tersisa di saldo dompet Anda memilki kemungkinan untuk diblokir secara sementara. Hal ini merupakan bagian dari prosedur umum yang berkaitan dengan UTXO dan parameter blockchain dari dompet Bitcoin Vault. Saldo Anda akan kembali dibuka ketika transaksi Anda diverifikasi (kurang lebih setelah sekitar 24 jam) atau dibatalkan (dalam waktu 24 jam).',
  },
  receive: {
    header: 'Terima koin',
    details: {
      amount: 'Jumlah',
      share: 'Bagikan',
      receiveWithAmount: 'Terima dengan jumlah',
      shareWalletAddress: 'TRANSLATION NEEDED | ENG: Share wallet address',
      receiveWithAmountSubtitle: 'TRANSLATION NEEDED | ENG: Enter the amount which you would like to receive. The entered amount will be included in the above QR code',
    },
    label: 'TRANSLATION NEEDED | ENG: Wallet address',
  },
  settings: {
    language: 'Bahasa',
    general: 'Umum',
    security: 'Keamanan',
    about: 'Tentang',
    electrumServer: 'Server Electrum',
    advancedOptions: 'Opsi lanjutan',
    changePin: 'Ubah PIN',
    fingerprintLogin: 'Login sidik jari',
    aboutUs: 'Tentang kami',
    header: 'Pengaturan',
    notSupportedFingerPrint: 'Perangkat anda tidak mendukung pemindai sidik jari',
    TouchID: 'Ijinkan penggunaan sidik jari',
    FaceID: 'Ijinkan penggunaan FaceID',
    Biometrics: 'Ijinkan penggunaan biometrik',
  },
  aboutUs: {
    header: 'Tentang kami',
    releaseNotes: 'Catatan rilis',
    runSelfTest: 'Jalankan tes mandiri',
    buildWithAwesome: 'Bangun dengan hebat:',
    rateGoldWallet: 'Beri peringkat GoldWallet',
    goToOurGithub: 'Masuk ke Github kami',
    alwaysBackupYourKeys: 'Selalu cadangkan kunci Anda',
    title: 'GoldWallet adalah dompet Bitcoin Vault gratis dan sumber terbuka. Dilisensi MIT.',
  },
  electrumServer: {
    header: 'Server Electrum',
    title: 'Ubah server electrum',
    description: 'Anda dapat merubah alamat server yang akan digunakan aplikasi Anda untuk menyambungkan diri. Alamat default direkomendasikan.',
    save: 'Simpan',
    useDefault: 'Gunakan default',
    host: 'host',
    port: 'port',
    successfullSave: 'Perubahan Anda berhasil disimpan. Mungkin dibutuhkan pemulaian ulang agar perubahan berlaku.',
    connectionError: 'Tidak dapat terhubung ke server Electrum yang tersedia',
  },
  advancedOptions: {
    title: 'Konfigurasikan opsi lanjutan',
    description: 'Mengaktifkan opsi Lanjutan akan memungkinkan Anda untuk memilih dari jenis dompet yang tercantum di bawah ini:\n P2SH, HD P2SH, HD segwit.',
  },
  selectLanguage: {
    header: 'Bahasa',
    restartInfo: 'Saat memilih bahasa baru, mungkin dibutuhkan pemulaian ulang GoldWallet agar perubahan berlaku',
    confirmation: 'Konfirmasi',
    confirm: 'Konfirmasi',
    alertDescription: 'Pilih bahasa dan mulai ulang aplikasi?',
    cancel: 'Batal',
  },
  contactList: {
    cancel: 'Batal',
    search: 'Cari',
    screenTitle: 'Buku alamat',
    noContacts: 'Tidak ada kontak',
    noContactsDesc1: 'Tidak ada kontak untuk ditampilkan. \n Klik',
    noContactsDesc2: 'untuk menambahkan kontak pertama Anda.',
    noResults: 'Tidak ada hasil untuk',
  },
  contactCreate: {
    screenTitle: 'Tambah kontak baru',
    subtitle: 'Kontak baru',
    description: 'Masukkan nama dan alamat\n untuk kontak baru Anda.',
    nameLabel: 'Nama',
    addressLabel: 'Alamat',
    buttonLabel: 'Tambah kontak baru',
    successTitle: 'Berhasil',
    successDescription: 'Hore! Anda telah berhasil\n menambahkan kontak.',
    successButton: 'Kembali ke Buku alamat',
    nameMissingAlphanumericCharacterError: 'TRANSLATION NEEDED | ENG: Name is missing alphanumeric character.',
    nameCannotContainSpecialCharactersError: 'TRANSLATION NEEDED | ENG: Name cannot contain special characters.',
  },
  contactDetails: {
    nameLabel: 'Nama',
    addressLabel: 'Alamat',
    editName: 'Edit nama',
    editAddress: 'Edit alamat',
    sendCoinsButton: 'Kirim koin',
    showQRCodeButton: 'Tampilkan kode QR',
    deleteButton: 'Hapus kontak',
    share: 'Bagikan',
  },
  contactDelete: {
    title: 'Hapus kontak Anda',
    header: 'Hapus kontak',
    description1: 'Anda yakin ingin menghapus',
    description2: '?\n Anda tidak dapat mengurungkannya.',
    no: 'Tidak',
    yes: 'Ya',
    success: 'Berhasil',
    successDescription: 'Kontak Anda berhasil dihapus.\n Anda sekarang dapat kembali ke Buku alamat.',
    successButton: 'Kembali ke Buku alamat',
  },
  scanQrCode: {
    permissionTitle: 'Izin untuk menggunakan kamera',
    permissionMessage: 'Kami membutuhkan izin Anda untuk menggunakan kamera',
    ok: 'Ok',
    cancel: 'Batal',
  },
  filterTransactions: {
    header: 'filter transaksi',
    receive: 'terima',
    send: 'kirim',
    filter: 'filter',
    to: 'ke',
    toAmount: 'ke jumlah',
    toDate: 'ke tanggal',
    from: 'dari',
    fromAmount: 'monto mínimo',
    fromDate: 'dari tanggal',
    clearFilters: 'bersihkan filter',
    received: 'Diterima',
    sent: 'DIkirim',
    transactionType: 'Tipe transaksi',
    transactionStatus: 'Status transaksi',
    status: {
      pending: 'Tertunda',
      annulled: 'Dianulir',
      done: 'Selesai',
      canceled: 'Dibatalkan',
      unblocked: 'Unblocked',
    },
  },
  authenticators: {
    sign: {
      error: 'Tidak ada authenticator yang dapat menandatangani transaksi',
    },
    options: {
      title: 'Opsi authenticator',
      export: 'Ekspor authenticator',
      pair: 'Sandingkan authenticator',
      sectionTitle: 'Umum',
      delete: 'Hapus authenticator',
    },
    pair: {
      title: 'Sandingkan authenticator',
      pin: 'PIN',
      publicKey: 'Kunci Publik',
      descPin: 'Gunakan PIN ini untuk mengonfirmasi penyandingan authenticator di aplikasi desktop.',
      descPublicKey: 'Anda dapat menggunakan Kunci Publik ini untuk mengimpor authenticator di aplikasi desktop saat proses pembuatan dompet dengan opsi GoldWallet.',
    },
    import: {
      title: 'Impor authenticator',
      success: 'Anda berhasil mengimpor authenticator. Authenticator kini siap digunakan.',
      subtitle: 'Impor authenticator Anda',
      desc1: 'Tuliskan frasa benih atau pindai kode QR authenticator yang ingin Anda impor.',
      desc2: 'pindai kode QR dengan mengklik tombol “atau pindai kode QR” di bawah',
      textAreaPlaceholder: 'Frasa benih',
    },
    export: {
      title: 'Ekspor authenticator',
    },
    delete: {
      title: 'Hapus authenticator',
      subtitle: 'Hapus authenticator Anda',
      success: 'Authenticator Anda berhasil dihapus. Anda selalu dapat membuat yang baru.',
    },
    list: {
      noAuthenticatorsDesc1: 'Ketuk',
      noAuthenticatorsDesc2: 'untuk menambahkan authenticator pertama Anda.',
      noAuthenticators: 'Belum ada Authenticator',
      scan: 'Pindai',
      title: 'Authenticator Bitcoin Vault',
    },
    add: {
      successTitle: 'Authenticator Anda siap!',
      title: 'Tambahkan authenticator baru',
      subtitle: 'Sandingkan authenticator',
      successDescription: 'Tuliskan frasa benih ini di suatu tempat yang aman. Untuk berjaga-jaga seandainya Anda perlu memulihkan pengautentikasi. Ingat bahwa pengautentikasi diperlukan untuk mengonfirmasi transaksi Cepat dan Batalkan.',
      description: 'Buka aplikasi desktop Electrum Vault lalu buat dompet baru. Ikuti langkah-langkah di layar hingga muncul kode QR. Gunakan aplikasi ini untuk memindainya untuk lanjut.',
      subdescription: 'Anda juga dapat mengimpor authenticator dengan memilih opsi di bawah.',
    },
    enterPIN: {
      subtitle: 'Masukkan PIN',
      description: 'Masukkan PIN ini ke dalam aplikasi desktop Electrum Vault untuk menyelesaikan proses penyandingan.',
    },
  },
  timeCounter: {
    title: 'Aplikasi diblokir',
    description: 'Aplikasi Anda telah diblokir karena percobaan masuk yang tidak berhasil. Tunggu selama waktu yang dibutuhkan untuk mencoba lagi.',
    tryAgain: 'Coba lagi',
    closeTheApp: 'Tutup aplikasi',
  },
  security: {
    jailBrokenPhone: 'Perangkat Anda tampak sudah di-jailbreak. Ini dapat menyebabkan masalah keamanan, kerusakan, atau masalah lainnya. Kami tidak menyarankan penggunaan GoldWallet di perangkat yang sudah di-jailbreak.',
    rootedPhone: 'Perangkat Anda tampaknya sudah di-root. Ini dapat menyebabkan masalah keamanan, kerusakan, atau masalah lainnya. Kami tidak menyarankan penggunaan GoldWallet di perangkat yang sudah di-root.',
    title: 'Masalah keamanan',
    noPinOrFingerprintSet: 'Nampaknya perangkat Anda tidak diamankan menggunakan PIN ataupun sidik jari. Kami tidak merekomendasikan untuk menggunakan GoldWallet di perangkat yang tidak diamankan.',
  },
  betaVersion: {
    title: 'Versi ini merupakan GoldWallet versi beta',
    description: 'Aplikasi masih akan menjalani pengujian akhir sebelum perilisan resmi. Aplikasi mobile dan semua yang konten yang Anda temukan didalamnya disediakan dalam basis \"apa adanya\" dan \"ketika tersedia\". Risiko penggunaan perangkat lunak ditanggung langsung oleh pengguna.',
    button: 'Saya mengerti dan menerima risikonya',
  },
}
