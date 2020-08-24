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
    or: 'TRANSLATION NEEDED | ENG: or',
    delete: 'TRANSLATION NEEDED | ENG: Delete',
    created: 'TRANSLATION NEEDED | ENG: Created on',
    invalid: 'TRANSLATION NEEDED | ENG: Invalid',
    satoshi: 'TRANSLATION NEEDED | ENG: Sat',
    next: 'TRANSLATION NEEDED | ENG: Next',
  },
  tabNavigator: {
    dashboard: 'Dasbor',
    settings: 'Pengaturan',
    addressBook: 'Buku alamat',
    wallets: 'TRANSLATION NEEDED | ENG: Wallets',
    authenticators: 'TRANSLATION NEEDED | ENG: Authenticators',
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
    successDescription: 'Hore!\nPIN Anda telah berhasil dibuat.',
    successDescriptionChangedPin: 'Hore!\nPIN Anda telah berhasil dirubah.',
    successButton: 'Pergi ke Dasbor',
    successButtonChangedPin: 'Kembali ke Pengaturan',
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
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance',
      wallet: 'TRANSLATION NEEDED | ENG: wallet',
      recover: 'TRANSLATION NEEDED | ENG: Cancel',
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
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance',
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
      cancelNow: 'TRANSLATION NEEDED | ENG: Cancel now',
      availableBalance: 'TRANSLATION NEEDED | ENG: Available balance after transaction',
      pendingBalance: 'TRANSLATION NEEDED | ENG: Pending balance after transaction',
    },
    create: {
      amount: 'Jumlah',
      fee: 'Biaya',
      setTransactionFee: 'Atur biaya transaksi',
      headerText: 'Jika ada sejumlah besar transaksi tertunda di jaringan (>1500), biaya lebih tinggi akan membuat transaksi Anda diproses lebih cepat. Nilai biasanya adalah 1-500 sat/b',
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
    header: 'Terima koin',
    details: {
      amount: 'Jumlah',
      share: 'Bagikan',
      receiveWithAmount: 'Terima dengan jumlah',
    },
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
    description: 'Mengaktifkan opsi Lanjutan akan memungkinkan Anda untuk memilih dari jenis dompet yang tercantum di bawah ini:\nP2SH, HD P2SH, HD segwit.',
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
    noContactsDesc1: 'Tidak ada kontak untuk ditampilkan. \nKlik',
    noContactsDesc2: 'untuk menambahkan kontak pertama Anda.',
    noResults: 'Tidak ada hasil untuk',
  },
  contactCreate: {
    screenTitle: 'Tambah kontak baru',
    subtitle: 'Kontak baru',
    description: 'Masukkan nama dan alamat\nuntuk kontak baru Anda.',
    nameLabel: 'Nama',
    addressLabel: 'Alamat',
    buttonLabel: 'Tambah kontak baru',
    successTitle: 'Berhasil',
    successDescription: 'Hore! Anda telah berhasil\nmenambahkan kontak.',
    successButton: 'Kembali ke Buku alamat',
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
    description2: '?\nAnda tidak dapat mengurungkannya.',
    no: 'Tidak',
    yes: 'Ya',
    success: 'Berhasil',
    successDescription: 'Kontak Anda berhasil dihapus.\nAnda sekarang dapat kembali ke Buku alamat.',
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
    filter: 'filter ',
    to: 'ke',
    toAmount: 'ke jumlah',
    toDate: 'ke tanggal',
    from: 'dari',
    fromAmount: 'monto mínimo',
    fromDate: 'dari tanggal',
    clearFilters: 'bersihkan filter',
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
