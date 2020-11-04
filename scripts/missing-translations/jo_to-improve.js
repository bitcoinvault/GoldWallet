const jo = {
  _: {
    bad_password: 'パスワードが間違っています。再度お試しください',
    cancel: 'キャンセル',
    click: 'クリック',
    confirm: '確認',
    continue: '続き',
    copied: 'コピーされました！',
    copy: 'コピー',
    created: '作成日',
    delete: '削除',
    enter_password: 'パスワードの入力',
    here: 'こちらへ',
    invalid: '無効',
    languageCode: 'ja',
    never: 'いいえ',
    next: '次へ',
    ok: '確認',
    or: 'または',
    satoshi: 'サトシ',
    save: '保存',
    scan: 'スキャン',
    storage_is_encrypted: 'ストレージは暗号化されています。それを復号化するためにはパスワードが必要です。',
  },
  aboutUs: {
    alwaysBackupYourKeys: '常にキーをバックアップしてください。',
    buildWithAwesome: '下記のように凄まじいビルドを提供します：',
    goToOurGithub: '当社のGithubに移動する',
    header: '会社紹介',
    rateGoldWallet: 'ゴールドウォレットを評価する',
    releaseNotes: 'リリースノート',
    runSelfTest: '自体テスト実行',
    title: 'ゴールドウォレットは無料でオープンソースのビットコインボルトウォレットです。許可されたMITです。',
  },
  advancedOptions: {
    description: '高級オプション設定を通じて次のウォレットを選択出来ます：P2SH、 HD P2SH、 HD segwit',
    title: '高級オプション設定する',
  },
  authenticators: {
    add: {
      description:
        'Electrum Vaultデスクトップ応用プログラムを開いた後、新しいウォレットを作ります。QRコードが表示されるまで画面の段階に従います。続けるにはこのアプリを使用してスキャンしてください。',
      subdescription: '以下のオプションを選択し、認証システムを読み込むことができます。',
      subtitle: '認証システムのペアリング',
      successDescription:
        '安全な所にこのシードフレーズを書き記してください。認証システムを復元する時必要です。迅速な取引及び取引のキャンセルを確認するにはこの認証システムが必要とされます。',
      successTitle: '認証システムが用意されました。',
      title: '新しい認証システム追加',
    },
    delete: {
      subtitle: '認証システムの削除',
      success: '認証システムを削除しました。いつでも新しく登録できます。',
      title: '認証システムの削除',
    },
    enterPIN: {
      description: 'このPINをElectrum Vaultデスクトップ応用プログラムに入力し、ペアリングを完了します。',
      subtitle: 'PIN入力',
    },
    errors: {
      noEmpty: '空白にすることはできません。',
    },
    export: {
      title: '認証システムを共有する',
    },
    import: {
      code: 'コード:',
      desc1: 'シードフレーズの記録もしくは認証者のQRコードをスキャンします。',
      desc2: '下記の「又はQRコード」をクリックし、QRコードをスキャンする',
      inUseValidationError: '使用中の名前です。有効な名前を入力してください。',
      mnemonicLength: 'ニーモニックには12の単語が必要です。',
      multipleQrCodesDescription:
        '一部の取引は複数のQRコードを生成します。 Electrum Vaultアプリケーションからすべてのコードをスキャンしてください。',
      multipleQrCodesTitle: '別のQRコードをスキャンする',
      scanNext: '次をスキャン',
      subtitle: '認証システムを読み込む',
      success: '認証システムを読み込みました。これから使用できます。',
      textAreaPlaceholder: 'シードフレーズ',
      title: '認証システムを登録する',
      inUseValidationError: 'TRANSLATION NEEDED | ENG: Name must be unique. Please enter a valid name.',
      mnemonicLength: 'TRANSLATION NEEDED | ENG: Mnemonic should have 12 words',
      scanNext: 'TRANSLATION NEEDED | ENG: Scan next',
      multipleQrCodesTitle: 'TRANSLATION NEEDED | ENG: Scan another QR code',
      multipleQrCodesDescription:
        'TRANSLATION NEEDED | ENG: Some transactions generate multiple QR codes. Make sure to scan all of them from the Electrum Vault application.',
      code: 'TRANSLATION NEEDED | ENG: Code: ',
    },
    list: {
      noAuthenticators: '認証システム登録なし',
      noAuthenticatorsDesc1: 'タブ',
      noAuthenticatorsDesc2: '1番目の認証者追加',
      scan: 'スキャン',
      title: 'Bitcoin Vault認証システム',
    },
    options: {
      delete: '認証システム削除',
      export: '認証システムを共有する',
      pair: '認証システムのペアリング',
      sectionTitle: '一般',
      title: '認証システムのオプション',
    },
    pair: {
      descPin: 'このPINを使用し、デスクトップ応用プログラムに認証者ペアリングを確認します。',
      descPublicKey:
        'Gold Walletオプションでウォレットを生成する間、この公開キーを使用し、デスクトップ応用プログラムに認証者を登録することができます。',
      pin: 'PIN',
      publicKey: '公開キー',
      title: '認証システムのペアリング',
    },
    publicKey: {
      okButton: 'TRANSLATION NEEDED | ENG: OK, I understand',
      title: 'TRANSLATION NEEDED | ENG: Public Key',
      subtitle:
        'TRANSLATION NEEDED | ENG: You can use this Public Key to import your authenticator to the Electrum Vault desktop application during the creation of the 2FA wallet.',
    },
    sign: {
      error: '認証システムは誰でも取引に署名出来ません。',
    },
  },
  betaVersion: {
    button: '私はリスクを認識しています',
    description:
      'まだ正式なリリース以前に最終テストを行っています。こちらに見せられる全てのコンテンツやモバイルアプリは"そのまま"と"使用可能"に基盤し提供されています。ソフトウェアの使用はユーザーのリスクを認識した上で行われます。',
    title: 'これはGoldWallletのベータ版です',
  },
  contactCreate: {
    addressLabel: 'アドレス',
    buttonLabel: '新しい連絡先を追加する',
    description: '新しい連絡先の名前とアドレスを入力してください。',
    nameCannotContainSpecialCharactersError: '名前には記号を含めません。',
    nameLabel: '名前',
    nameMissingAlphanumericCharacterError: '名前に英文字、数字が含まれていません。',
    screenTitle: '新しい連絡先を追加する',
    subtitle: '新しい連絡先',
    successButton: 'アドレス帳に戻る',
    successDescription: '万歳！新しい連絡先追加に成功しました。',
    successTitle: '成功',
  },
  contactDelete: {
    description1: '削除しますか',
    description2: '？\n  削除の後には戻せることはできません。',
    header: '連絡先の削除',
    no: 'いいえ',
    success: '成功',
    successButton: 'アドレス帳に戻る',
    successDescription: '連絡先削除に成功しました。もうアドレス帳に戻れます。',
    title: '貴下の連絡先を削除してください。',
    yes: 'はい',
  },
  contactDetails: {
    addressLabel: 'アドレス',
    deleteButton: '連絡先を削除する',
    editAddress: 'アドレス修正',
    editName: '名前修正',
    nameLabel: '名前',
    sendCoinsButton: 'コイン転送',
    share: '共有',
    showQRCodeButton: 'QRコードを表示する',
  },
  contactList: {
    cancel: 'キャンセル',
    noContacts: '連絡先無し',
    noContactsDesc1: '表示する連絡先がありません。 \n  クリック',
    noContactsDesc2: '１番目の連絡先を追加します。',
    noResults: '次に関する結果がありません。',
    screenTitle: 'アドレス帳',
    search: '検索する',
  },
  electrumServer: {
    connectionError: '提供されたElectrumサーバーに繋がりません。',
    description: 'アプリケーションを連結するサーバーのアドレスを変更出来ます。基本アドレスを使用する事をお勧めします。',
    header: 'Electrumサーバー',
    host: 'ホスト',
    port: 'ポート',
    save: '保存する',
    successfullSave: '変更事項が保存されました。変更事項を適用するには再起動が必要です。',
    title: 'Electrumサーバー変更',
    useDefault: 'デフォルト値使用',
  },
  filterTransactions: {
    clearAll: 'すべて消去',
    clearFilters: 'フィルターを消す',
    filter: 'フィルター設定',
    from: '送金者',
    fromAmount: '最小金額',
    fromDate: '開始日',
    header: '取引分類',
    receive: '入金',
    received: '受領済み',
    send: '送金',
    sent: '送信済み',
    status: {
      canceled: 'キャンセル済み',
      canceledDone: 'キャンセル完了',
      done: '完了',
      pending: '保留中',
      unblocked: 'ブロック解除',
      annulled: '無効化',
      canceledDone: 'TRANSLATION NEEDED | ENG: Canceled-done',
    },
    to: '受領者',
    toAmount: '最大金額',
    toDate: '終了日',
    transactionStatus: '取引状態',
    transactionType: '取引タイプ',
    clearAll: 'TRANSLATION NEEDED | ENG: Clear all',
  },
  message: {
    allDone: 'すべて完了しました!',
    cancelTxSuccess: '取引の取消しが正常に完了しました。\n  コインは間もなく届きます。',
    creatingAuthenticator: '自分の認証システムを生成中です。',
    creatingAuthenticatorDescription:
      '認証システムを生成中です。しばらくお待ちください。\nしばらく時間がかかる可能性があります。',
    creatingWallet: 'ウォレットを生成中です。',
    creatingWalletDescription: 'ウォレットを生成している間お待ちください。しばらく時間がかかる場合があります。',
    generateAddressesError: 'アドレスを生成できません',
    hooray: 'おめでとうございます!',
    importingAuthenticator: '認証システムを登録する',
    importingAuthenticatorDescription:
      '認証システムを登録しています。しばらくお待ちください。\nしばらく時間がかかる可能性があります。',
    noTransactions: 'このウォレットには取引がありません。',
    noTransactionsDesc: 'これまで未使用のウォレットを読み込もうとしています',
    returnToAuthenticators: '認証システムに戻る',
    returnToDashboard: 'ダッシュボードに戻る',
    returnToWalletChoose: 'ウォレットタイプの選択に戻る',
    returnToWalletImport: 'ウォレット登録に戻る',
    somethingWentWrong: '問題が発生しました',
    somethingWentWrongWhileCreatingWallet:
      'ウォレットの作成中に問題が発生しました。ダッシュボードに戻って、再度お試しください。',
    success: '成功',
    successfullWalletDelete: 'ウォレット削除に成功しました。ただいま、ダッシュボードに戻ります。',
    successfullWalletImport: 'ウォレット登録に成功しました。ただいま、ウォレットを使用できます。',
    wrongMnemonic: 'ニーモニックが間違っています。',
    wrongMnemonicDesc:
      '指定されたニーモニックと一致するサポート中のウォレットはありません。\n無効なニーモニックまたはこれまで未使用のウォレットを読み込もうとしています',
    processing: 'TRANSLATION NEEDED | ENG: Processing',
    bePatient: 'TRANSLATION NEEDED | ENG: Please be patient, it may take a while.',
  },
  onboarding: {
    changePin: 'PINコードの変更',
    confirmNewPin: '新しいPINコードの確認',
    confirmPassword: '取引パスワードの確認',
    confirmPin: 'PINコードの確認',
    createNewPin: '新しいPINコード',
    createPassword: '取引パスワードの生成',
    createPasswordDescription:
      'すべての取引を確認するため、取引パスワードが利用されます。\n設定されたパスワードの変更は不可能です。\n取引のパスワードは最小8桁以上の英文字と数字で構成しなければなりません。',
    createPin: 'PINコードの生成',
    createPinDescription: 'PINコードはアプリケーションのログインに利用されます。設定メニューから変更が可能です。',
    currentPin: '現在のPINコード',
    failedTimes: '試み失敗',
    failedTimesErrorInfo: '3回失敗する際、以下の入力がブロックされます。',
    goBack: '戻る',
    minutes: '分',
    numberOfAttemptsExceeded: '最大許容回数を超えました',
    onboarding: '設定実行',
    passwordDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    pin: 'PINコード',
    pinDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    seconds: '秒',
    successButton: 'ダッシュボードに戻る',
    successButtonChangedPin: '設定に戻る',
    successDescription: 'おめでとうございます！\n  PINコード生成が正常に完了されました。',
    successDescriptionChangedPin: 'おめでとうございます！\n  PINコード変更が正常に完了されました。',
    tryAgain: 'しばらくしてからもう一度お試しください',
  },
  receive: {
    details: {
      amount: '金額',
      receiveWithAmount: '金額で受け取る',
      receiveWithAmountSubtitle: '受け取る金額を入力してください。入力した金額に応じてQRコードはアップデートされます。',
      share: '共有',
      shareWalletAddress: 'TRANSLATION NEEDED | ENG: Share wallet address',
      receiveWithAmountSubtitle:
        'TRANSLATION NEEDED | ENG: Enter the amount which you would like to receive. The QR code will update accordingly to include the amount.',
    },
    header: 'コインの受け取り',
    label: 'ウォレットアドレス',
  },
  scanQrCode: {
    cancel: 'キャンセル',
    ok: '確認',
    permissionMessage: '貴下のカメラ使用について許容が必要です。',
    permissionTitle: 'カメラの使用許容',
  },
  security: {
    jailBrokenPhone:
      '貴下のデバイスが脱獄されたようです。この場合セキュリティ問題や衝突、その他、様々な問題が発生する恐れがあります。脱獄されたデバイスではGoldWalletを使用しないようお願いします。',
    noPinOrFingerprintSet:
      'デバイスにパスワード又は指紋が登録されていません。安全ではないデバイスでのGoldWallet使用しないようお願いします。\n',
    rootedPhone:
      '貴下のデバイスがルーティングされたようです。この場合セキュリティ問題や衝突、その他様々な問題が発生する恐れがあります。ルーティングされたデバイスではGoldWalletを使用しないようお願いします。\n',
    title: 'セキュリティ問題',
  },
  selectLanguage: {
    alertDescription: '言語を選択し、アプリケーションを再起動しますか？',
    cancel: 'キャンセル',
    confirm: '確認',
    confirmation: '確認',
    header: '言語',
    restartInfo: '新しい言語を選択する時、変更事項を適用するにはGold Walletを再起動しなければなりません。',
  },
  send: {
    confirm: {
      availableBalance: '取引後の利用可能残高',
      cancelNow: '今すぐキャンセル',
      pendingBalance: '取引後の保留残高',
      sendNow: '今すぐ送金する',
    },
    create: {
      amount: '金額',
      fee: '手数料',
      headerText:
        'ネットワークに多数の保留中の取引がある場合（1,500超）、高い料金を支払うほど、取引の処理速度が早くなります。通常は1～500 sat/bです',
      setTransactionFee: '取引手数料の設定',
    },
    details: {
      address: 'アドレス',
      address_field_is_not_valid: 'アドレスフィールドが無効です',
      amount_field_is_not_valid: '金額フィールドが無効です',
      amount_placeholder: '（BTCVの）送信する金額',
      cancel: 'キャンセル',
      create: 'インボイスの作成',
      create_tx_error: '取引作成中にエラーが発生しました。アドレスが有効なのかを確認してください。',
      fee: '手数料：',
      fee_field_is_not_valid: '料金フィールドが無効です',
      fee_placeholder: '（BTCVの）追加取引のパスワードの手数料',
      feeUnit: 'Sat/B',
      next: '次へ',
      note: 'メモ（オプション）',
      note_placeholder: '個人メモ',
      remaining_balance: '残高',
      scan: 'スキャン',
      send: '送金',
      title: '取引の作成',
      to: '送信先',
      total_exceeds_balance: '送金する金額が利用可能な残高を超えました。',
    },
    error: {
      description: '取引を生成する前にビットコインボルトウォレットを追加しなければなりません。',
      title: 'エラー',
    },
    header: 'コインを転送する',
    recovery: {
      confirmFirstSeed: 'キャンセル・シードフレーズで確定する',
      confirmFirstSeedDesc:
        'お使いのウォレットの作成時に生成された最初のPDF文書を開き、秘密キーのシードフレーズを同じ順序で書き留めます。',
      confirmSecondSeed: 'クイック・シードフレーズで確定する',
      confirmSecondSeedDesc:
        'お使いのウォレットの作成時に生成された2番目のPDF文書を開き、秘密キーのシードフレーズを同じ順序で書き留めます。',
      confirmSeed: 'キャンセル・シードフレーズで確定する',
      confirmSeedDesc:
        'お使いのウォレットの作成時に生成されたPDF文書を開き、秘密キーのシードフレーズを同じ順序で書き留めます。',
      recover: 'キャンセル',
      useWalletAddress: 'このウォレットのアドレスを使用',
    },
    success: {
      description: '取引が完了しました。',
      done: '完了',
      return: 'ダッシュボードに戻る',
      title: '成功',
    },
    transaction: {
      alert: '保安',
      alertDesc: 'この取引は144ブロックもしくは約24時間がかかります。この間にはキャンセルができます。',
      fastSuccess: 'クイック取引が正常に完了しました。',
      instant: 'クイック',
      instantDesc: 'この取引は、ただちに確定されます。細心の注意を払った上でご利用ください。',
      lightningError:
        'このアドレスはLightning送状用に表示されます。この送状について支払するにはLightningウォレットに移動してお支払いください。',
      scanInstantKeyDesc:
        'ウォレットを作る際には生成したPDF文章を開いた後、秘密キーQRコードをスキャンし取引を送ります。',
      scanInstantKeyTitle: '迅速取引キーをスキャンする',
      type: '取引タイプ',
      watchOnlyError: '取引を送れないウォレットだけを表示する',
    },
    warning: '警告:',
    warningGeneral:
      '警告: 安全な取引機能の使用過程でお客様のウォレットの一部の資金がブロックされる可能性があります。これはUTXOやビットコインボルト・ウォレットのブロックチェーン範囲に関する一般的なプロセスです。取引が検証 されるか(約24時間後) キャンセルになると (24時間以内) 資金のブロックが解除されます。',
  },
  settings: {
    about: '紹介',
    aboutUs: '会社紹介',
    advancedOptions: '高級オプション',
    Biometrics: '生体認証を許可する',
    changePin: 'PIN変更',
    electrumServer: 'Electrumサーバー',
    FaceID: 'Face IDを許可する',
    fingerprintLogin: '指紋ログイン',
    general: '一般',
    header: '設定',
    language: '言語',
    notSupportedFingerPrint: '該当のデバイスでは指紋認識を支援しません。',
    security: 'セキュリティ',
    TouchID: '指紋認識を許可する',
  },
  tabNavigator: {
    addressBook: 'アドレス帳',
    authenticators: '認証システム',
    settings: '設定',
    wallets: 'ウォレット',
  },
  timeCounter: {
    closeTheApp: '応用プログラムを閉じる',
    description: 'ログインに失敗し、応用プログラムがブロックされました。再度試みるにはしばらくお待ちください。',
    title: '応用プログラムがブロックされました',
    tryAgain: 'もう一度お試してください',
  },
  transactions: {
    details: {
      addNote: 'メモの追加',
      addToAddressBook: 'アドレス帳に追加',
      amount: '金額',
      blocked: 'ブロック',
      bytes: 'バイト',
      confirmations: '確認',
      copy: 'コピー',
      copyAndBoriadcast: 'コピーして掲示する。',
      details: '詳細',
      detailTitle: '取引詳細',
      fee: '手数料',
      from: '送信元',
      inputs: '入力',
      noLabel: 'ラベル無し',
      note: 'メモ',
      numberOfCancelTransactions: 'キャンセル取引の数',
      ouputs: '出力',
      returnedFee: '返還手数料：',
      satoshiPerByte: 'バイト当たりのサトシ',
      sendCoins: 'コインを転送する',
      timePending: '保留期間',
      title: '取引',
      to: '受信先',
      toExternalWallet: '外部ウォレットへ転送',
      toInternalWallet: '内部ウォレットへ転送',
      totalReturnedFee: '総返還手数料：',
      transactioFee: '取引手数料',
      transactionDetails: '取引詳細',
      transactionHex: '取引へクス（hex）',
      transactionHexDescription: '署名された取引のヘクスがネットワークに掲示する準備ができています。',
      transactionId: '取引ID',
      transactionType: '取引タイプ',
      txSize: 'TXサイズ',
      unblocked: 'ブロック解除',
      verify: 'coinb.inから確認',
      viewInBlockRxplorer: 'ブロックエクスプローラーの表示',
      walletType: 'ウォレットタイプ',
    },
    errors: {
      notEnoughBalance: '残高不足。少ない金額で試してください。',
    },
    label: {
      blocked: 'ブロック',
      canceled: 'キャンセル済み',
      canceledDone: 'キャンセル完了',
      done: '完了',
      pending: '保留中',
      unblocked: 'ブロック解除',
      annulled: '無効化',
      blocked: 'TRANSLATION NEEDED | ENG: blocked',
      canceledDone: 'TRANSLATION NEEDED | ENG: canceled - done',
    },
    list: {
      conf: '確認',
    },
    transactionTypeLabel: {
      canceled: 'キャンセル済み',
      secure: '安全な',
      secureFast: '安全で早い',
      standard: '標準',
    },
  },
  unlock: {
    confirmButton: '指紋認証を完了してください。',
    enter: 'PINコードの入力',
    title: '解除',
    touchID: '"ゴールドウォレット" のTouch ID',
  },
  unlockTransaction: {
    description: '続くには取引のパスワードを入力してください。',
    headerText: '取引の確認',
    title: '取引パスワードの確認',
  },
  wallets: {
    add: {
      addWalletButton: '新しいウォレットの追加',
      advancedOptions: '高度なオプション',
      air: '安全でキャンセルが可能で、早くて安全な取引を保します。',
      ar: '安全でキャンセルが可能な取引を保します。',
      description: '新しいウォレットの種類や名前を入力してください。',
      failed: 'ウォレットの生成に失敗しました',
      importWalletButton: 'ウォレットの登録',
      inputLabel: '名前',
      legacy: 'デフォルトタイプの取引を生成します。',
      legacyHDP2SH: 'これには、単一の24ワードのシードから生成されたP2SHアドレスのツリーが含まれています',
      legacyHDP2SHTitle: 'レガシーHD P2SH',
      LegacyHDSegWit:
        'これには、単一の12ワードのシードから生成されたネイティブのSegwitアドレスのツリーが含まれています',
      legacyHDSegWitTitle: 'スタンダードHD SegWit',
      LegacyP2SH: 'これには、単一のP2SHアドレスが含まれています',
      legacyP2SHTitle: 'スタンダードP2SH',
      legacyTitle: 'スタンダード',
      multipleAddresses: '単一の24文字シードから生成されるP2SHアドレスのツリーを含まれています。',
      publicKeyError: '入力された公開キーが間違いました。',
      segwidAddress: '単一の24文字シードから生成されるsegwitアドレスのツリーを含まれています。',
      singleAddress: '単一のP2SHアドレスが含まれています。',
      subtitle: 'ウォレットに名前を付ける',
      title: '新しいウォレットの追加',
      walletType: 'ウォレットのタイプ',
    },
    addSuccess: {
      description: 'このシードフレーズを安全な所に書いて置いてください。ウォレットを復旧するためのバックアップです。',
      okButton: 'はい、これを書きました！',
      subtitle: 'ウォレットの生成を完了しました！',
      title: '新しいウォレットの追加',
    },
    dashboard: {
      allWallets: 'すべてのウォレット',
      availableBalance: '利用可能な残高',
      noTransactions: '表示する取引がありません。',
      noWallets: 'ウォレット無し',
      noWalletsDesc1: '表示するウォレットがありません。',
      noWalletsDesc2: '最初のウォレットに追加する。',
      receive: '受け取る',
      recover: 'キャンセル',
      send: '転送する',
      title: 'ウォレット',
      wallet: 'ウォレット',
    },
    deleteWallet: {
      description1: '削除してもよろしいでしょうか',
      description2: '？以降にはキャンセルを取り消すことはできません。',
      header: 'ウォレットの削除',
      no: 'いいえ',
      title: 'ご使用のウォレットを削除する',
      yes: 'はい',
    },
    details: {
      deleteWallet: 'ウォレットの削除',
      details: '詳細',
      edit: '編集',
      exportWallet: 'ウォレットを共有する',
      latestTransaction: '最新の取引',
      nameEdit: '名前の変更',
      nameLabel: '名前',
      showWalletXPUB: 'ウォレットXPUBを表示する',
      typeLabel: 'タイプ',
    },
    errors: {
      duplicatedPublicKey: 'この公開キーはすでに追加されています。',
      invalidMnemonic: '誤ったニーモニック',
      invalidMnemonicWordsNumber: '{expectedWordsNumber}が予想されます。{receivedWordsNumber}を入力',
      invalidPrivateKey: '誤った秘密キー',
      invalidPublicKey: '誤った公開キー',
      invalidQrCode: '誤ったQRコード',
      invalidSign: '取引に署名できません。',
      noIndexForWord: '{word}についてのワードのインデックスが見つかりませんでした。',
    },
    export: {
      title: 'ウォレットを共有する',
    },
    exportWallet: {
      header: 'ウォレットの共有',
      title: 'シードフレーズ',
    },
    exportWalletXpub: {
      header: 'ウォレットXPUB',
    },
    import: {
      do_import: '登録する',
      error: '読み込みに失敗しました。提供されたデータが有効であることを確認してください。',
      explanation:
        'ここにユーザーのニーモニック、秘密キー、WIF、またはお客様が持っている全てのことを入力してください。GoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットを登録します',
      imported: '登録しました',
      scan_qr: 'または代わりにスキャンしますか？',
      success: '成功',
      title: '登録する',
    },
    importWallet: {
      chooseTypeDescription: '登録するウォレットのタイプを選択',
      customWords: 'カスタムワード',
      extendWithCustomWords: 'カスタムワードでシード拡張',
      header: 'ウォレットを登録する',
      import: '登録する',
      importARDescription1: 'シードフレーズの入力',
      importARDescription2: '登録したウォレットのQRコードをスキャンする',
      placeholder: 'シードフレーズ、秘密キー、WIF',
      scanCancelPubKey: 'キャンセルキーのQRコードをスキャンする',
      scanFastPubKey: 'クイックキーのQRコードをスキャンする',
      scanPublicKeyDescription:
        '登録するウォレットの生成の時に生成された最初のPDF文書を開き、このアプリで公開キーQRコードをスキャンします。',
      scanQrCode: '又はQRコードをスキャンする',
      scanWalletAddress: 'ウォレットのアドレスをスキャンする',
      scanWalletAddressDescription: '共用アドレスのQRコードをスキャンして、GoldWalletとの統合を開始する。',
      subtitle:
        'ここにユーザーのニーモニック、秘密キー、WIF、またはお客様が持っている全てのことを入力してください。\nGoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットを登録します。',
      title: '使用しているウォレットをインポートする',
      unsupportedElectrumVaultMnemonic:
        'これはElectrum Vaultのシードです。このシードは現在サポートされていません。間もなくサポートされる予定です。',
      walletInUseValidationError: 'ウォレットはすでに使用されています。有効なウォレットを入力してください。',
      extendWithCustomWords: 'TRANSLATION NEEDED | ENG: Extend this seed with custom words',
      customWords: 'TRANSLATION NEEDED | ENG: Custom words',
    },
    publicKey: {
      instantDescription:
        '別のデバイスでWebキー生成ツールにアクセスして、このアプリで公開キーQRコードをスキャンします。キーはPDF形式で共有することを忘れないでください。',
      instantSubtitle: 'クイックキーを追加',
      recoveryDescription:
        '別のデバイスでWebキー生成ツールにアクセスして、このアプリで公開キーQRコードをスキャンします。キーは必ずPDF形式で共有することを忘れないでください。',
      recoverySubtitle: 'キャンセルキーを追加',
      scan: 'スキャン',
      webKeyGenerator: 'Webキー生成ジェネレータ：',
    },
    scanQrWif: {
      bad_password: '誤ったパスワード',
      bad_wif: '誤っているWIF',
      cancel: 'キャンセル',
      decoding: '復号',
      go_back: '戻る',
      imported_legacy: '登録済みLegacy',
      imported_segwit: '登録済みSegWit',
      imported_watchonly: '登録済みWatch-only',
      imported_wif: '登録済みWIF',
      input_password: 'パスワードを入力する',
      password_explain: 'これはBIP38暗号化秘密キーです',
      wallet_already_exists: 'このウォレットはすでに存在しています',
      with_address: 'アドレスで',
    },
    wallet: {
      latest: '最新の取引',
      none: '無し',
      pendingBalance: '保留中の残高',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'ウォレット',
    },
  },
};
