const jo = {
  _: {
    languageCode: 'ja',
    storage_is_encrypted: 'ストレージは暗号化されています。それを復号化するためにはパスワードが必要です。',
    enter_password: 'パスワードの入力',
    bad_password: 'パスワードが間違っています。再度お試しください',
    never: 'いいえ',
    continue: '続き',
    ok: '確認',
    click: 'クリック',
    here: 'こちらへ',
    save: '保存',
    confirm: '確認',
    copy: 'コピー',
    copied: 'コピーされました！',
    or: 'または',
    delete: '削除',
    created: '作成日',
    invalid: '無効',
    satoshi: 'サトシ',
    next: '次',
  },
  tabNavigator: {
    dashboard: 'ダッシュボード',
    settings: '設定',
    addressBook: 'アドレス帳',
    wallets: 'ウォレット',
    authenticators: '認証システム',
  },
  message: {
    somethingWentWrong: '問題が発生しました',
    somethingWentWrongWhileCreatingWallet: 'ウォレットの作成中に問題が発生しました。ダッシュボードに戻って、再度お試しください。',
    success: '成功',
    successfullWalletImport: 'ウォレット登録に成功しました。ただいま、ダッシュボードに戻ります。',
    successfullWalletDelete: 'ウォレット削除に成功しました。ただいま、ダッシュボードに戻ります。',
    returnToDashboard: 'ダッシュボードに戻る',
    creatingWallet: 'ウォレットの生成',
    creatingWalletDescription: 'ウォレットを生成している間お待ちください。しばらく時間がかかる場合があります。',
    allDone: 'すべて完了しました!',
    hooray: 'おめでとうございます!',
    cancelTxSuccess: '取引の取消しが正常に完了しました。\nコインは間もなく届きます。',
    wrongMnemonic: 'ニーモニックが間違っています。',
    wrongMnemonicDesc: '指定されたニーモニックと一致するサポート中のウォレットはありません。\n無効なニーモニックまたはこれまで未使用のウォレットを読み込もうとしています',
    returnToWalletChoose: 'ウォレットタイプの選択に戻る',
    returnToWalletImport: 'ウォレット登録に戻る',
    generateAddressesError: 'アドレスを生成できません',
    noTransactions: 'このウォレットには取引がありません。',
    noTransactionsDesc: 'これまで未使用のウォレットを読み込もうとしています',
    returnToAuthenticators: '認証システムに戻る',
    creatingAuthenticator: '自分の認証システムを生成する',
    creatingAuthenticatorDescription: '認証システムを生成中です。しばらくお待ちください。\nはしばらく時間がかかる可能性があります。',
    importingAuthenticator: '認証システムを登録する',
    importingAuthenticatorDescription: '認証システムを登録しています。しばらくお待ちください。\nしばらく時間がかかる可能性があります。',
  },
  onboarding: {
    onboarding: '設定実行',
    pin: 'PINコード',
    createPin: 'PINコードの生成',
    createNewPin: '新しいPINコード',
    createPassword: '取引パスワードの生成',
    createPinDescription: 'PINコードはアプリケーションのログインに利用されます。設定メニューから変更が可能です。',
    confirmPin: 'PINコードの確認',
    confirmNewPin: '新しいPINコードの確認',
    confirmPassword: '取引パスワードの確認',
    passwordDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    createPasswordDescription: 'すべての取引を確認するため、取引パスワードが利用されます。\n設定されたパスワードの変更は不可能です。\n取引のパスワードは最小8桁以上の英文字と数字で構成しなければなりません。',
    changePin: 'PINコードの変更',
    currentPin: '現在のPINコード',
    pinDoesNotMatch: 'パスワードが一致しません。有効なパスワードを入力してください。',
    successDescription: 'おめでとうございます！\nPINコード生成が正常に完了されました。',
    successDescriptionChangedPin: 'おめでとうございます！\nPINコード変更が正常に完了されました。',
    successButton: 'ダッシュボードに戻る',
    successButtonChangedPin: '設定に戻る',
    failedTimes: '試み失敗',
    failedTimesErrorInfo: '3回失敗する際、以下の入力がブロックされます。',
    goBack: '戻る',
    minutes: '分',
    numberOfAttemptsExceeded: '最大許容回数を超えました',
    seconds: '秒',
    tryAgain: 'しばらくしてからもう一度お試しください',
  },
  unlock: {
    title: '解除',
    touchID: '\"ゴールドウォレット\" のTouch ID',
    confirmButton: '指紋認証を完了してください。',
    enter: 'PINコードの入力',
  },
  unlockTransaction: {
    headerText: '取引の確認',
    title: '取引パスワードの確認',
    description: '取引パスワードを確認し、取引を続ける。',
  },
  wallets: {
    dashboard: {
      title: 'ウォレット',
      allWallets: 'すべてのウォレット',
      noWallets: '認証システム登録無し',
      noWalletsDesc1: '表示するウォレットがありません。',
      noWalletsDesc2: '最初のウォレットに追加する。',
      send: 'コインを送金する',
      receive: 'コインを受け取る',
      noTransactions: '表示する取引がありません。',
      availableBalance: '利用可能残高',
      wallet: 'ウォレット',
      recover: 'キャンセル',
    },
    walletModal: {
      btcv: 'BTCV',
      wallets: 'ウォレット',
    },
    importWallet: {
      title: 'ご使用のウォレットをインポートする',
      header: 'ウォレットのインポートする',
      subtitle: 'ここにユーザーのニーモニックフレーズ、秘密鍵、WIF、または他の情報を入力してください。\nGoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットをインポートします。',
      placeholder: 'ニーモニックフレーズ、秘密鍵、WIF',
      import: '登録する',
      scanQrCode: '又はQRコードをスキャンする',
      walletInUseValidationError: 'ウォレットはすでに使用されています。有効なウォレットを入力してください。',
      chooseTypeDescription: '登録するウォレットのタイプを選択',
      importARDescription1: 'シードフレーズの入力',
      importARDescription2: '登録するウォレットのORコードをスキャンする',
      scanWalletAddress: 'ウォレットのアドレスをスキャンする',
      scanWalletAddressDescription: 'GoldWalletとの統合を開始するには、共用アドレスのQRコードをスキャンしてください。',
      scanFastPubKey: 'クイックキーのQRコードをスキャン',
      scanCancelPubKey: 'キャンセルキ－のQRコードをスキャン',
      scanPublicKeyDescription: '登録するウォレットの生成の時に生成された最初のPDF文書を開き、このアプリで公開鍵QRコードをスキャンします。',
      unsupportedElectrumVaultMnemonic: 'これはElectrum Vaultのシードです。このシードは現在サポートされていません。後にサポートされる予定です。',
    },
    exportWallet: {
      title: 'ニーモニックのフレーズ',
      header: 'ウォレットの共有',
    },
    exportWalletXpub: {
      header: 'ウォレットXPUB',
    },
    deleteWallet: {
      title: 'ご使用のウォレットを削除する',
      header: 'ウォレットの削除',
      description1: '削除してもよろしいでしょうか。',
      description2: '？以降にはキャンセルを取り消すことはできません。',
      no: 'いいえ',
      yes: 'はい',
    },
    wallet: {
      none: 'なし',
      latest: '最新の取引',
      pendingBalance: '保留中の残高',
    },
    add: {
      title: '新しいウォレットの追加',
      subtitle: 'ウォレットに名前を付ける',
      description: '新しいウォレットの名前を入力してください。',
      inputLabel: '名前',
      addWalletButton: '新しいウォレットの追加',
      importWalletButton: 'ウォレットのインポート',
      advancedOptions: '高度なオプション',
      multipleAddresses: '複数のアドレス',
      singleAddress: '単一のアドレス',
      segwidAddress: '単一の24文字シードから生成されるsegwitアドレスのツリーを含めます。',
      failed: 'ウォレットの生成に失敗しました',
      walletType: 'ウォレットのタイプ',
      ar: '標準取引とキャンセル 取引を修行します。',
      air: '標準取引、キャンセル取引やクイック 取引を修行します。',
      legacyTitle: 'レガシー',
      legacyHDP2SHTitle: 'レガシーHD P2SH',
      legacyP2SHTitle: 'レガシーP2SH',
      legacyHDSegWitTitle: 'レガシーHD SegWit',
      legacy: 'デフォルトタイプの取引を生成します。',
      legacyHDP2SH: 'これには、単一の24ワードのシードから生成されたP2SHアドレスのツリーが含まれています',
      LegacyP2SH: 'これには、単一のP2SHアドレスが含まれています',
      LegacyHDSegWit: 'これには、単一の24ワードのシードから生成されたネイティブのSegwitアドレスのツリーが含まれています',
      publicKeyError: '入力された公開キーが間違いました。',
    },
    addSuccess: {
      title: '新しいウォレットの追加',
      subtitle: '成功',
      description: 'ウォレットが作成されました。時間を取って、このニーモニックのフレーズを紙に書いてください。それはバックアップです。それを使用して、他のデバイスでウォレットをリストアすることができます。',
      okButton: 'はい、これを書きました！',
    },
    details: {
      edit: '編集',
      latestTransaction: '最新の取引',
      typeLabel: 'タイプ',
      nameLabel: '名前',
      exportWallet: 'ウォレットを共有する',
      showWalletXPUB: 'ウォレットXPUBを表示する',
      deleteWallet: 'ウォレットの削除',
      nameEdit: '名前の変更',
    },
    export: {
      title: 'ウォレットのエクスポート',
    },
    import: {
      title: 'インポート',
      explanation: 'ここにユーザーのニーモニックフレーズ、秘密鍵、WIF、または取得したその他のものを入力してください。GoldWalletでは、最善を尽くして、正しいフォーマットを推測し、ウォレットをインポートします',
      imported: '登録する',
      error: '読み込みに失敗しました。提供されたデータが有効であることを確認してください。',
      success: '成功',
      do_import: '登録する',
      scan_qr: 'または代わりにスキャンしますか？',
    },
    scanQrWif: {
      go_back: '戻る',
      cancel: 'キャンセル',
      decoding: '復号',
      input_password: 'パスワードを入力する',
      password_explain: 'これはBIP38暗号化秘キーです',
      bad_password: '誤ったパスワード',
      wallet_already_exists: 'このウォレットはすでに存在しています',
      bad_wif: '誤っているWIF',
      imported_wif: 'インポート済みWIF',
      with_address: 'アドレスで',
      imported_segwit: '登録済みSegWit',
      imported_legacy: '登録済みLegacy',
      imported_watchonly: '登録済みWatch-only',
    },
    publicKey: {
      recoverySubtitle: 'キャンセルキーを追加',
      webKeyGenerator: 'Webキー生成ツール：',
      recoveryDescription: '別のデバイスでWebキー生成ツールにアクセスして、このアプリで公開鍵QRコードをスキャンします。キーは必ずPDF形式でエクスポートすることを忘れないでください。',
      instantSubtitle: 'クイックキーを追加',
      instantDescription: '別のデバイスでWebキー生成ツールにアクセスして、このアプリで公開鍵QRコードをスキャンします。キーはPDF形式でエクスポートすることを忘れないでください。',
      scan: 'スキャン',
    },
    errors: {
      invalidMnemonicWordsNumber: '{expectedWordsNumber}が予想されます。{receivedWordsNumber}を入力',
      noIndexForWord: '{word}についてのワードのインデックスが見つかりませんでした。',
      invalidPrivateKey: '誤った秘密キー',
      invalidPublicKey: '誤った公開キー',
      invalidMnemonic: '誤ったニーモニック',
      invalidQrCode: '誤ったQRコード',
      invalidSign: '取引に署名できません。',
      duplicatedPublicKey: 'この公開キーはすでに追加されています。',
    },
  },
  transactions: {
    list: {
      conf: '確認',
    },
    details: {
      title: '取引',
      detailTitle: '取引詳細',
      transactionHex: '取引へクス（hex）',
      transactionHexDescription: '署名された取引のヘクスがネットワークに掲示する準備ができています。',
      copyAndBoriadcast: 'コピーして後に掲示する。',
      verify: 'coinb.inから確認',
      amount: '金額',
      fee: '手数料',
      txSize: 'TXサイズ',
      satoshiPerByte: 'バイト当たりのサトシ',
      from: '送信元',
      to: '受信先',
      bytes: 'バイト',
      copy: 'コピー',
      noLabel: 'ラベルなし',
      details: '詳細',
      transactionId: '取引ID',
      confirmations: '確認',
      transactionDetails: '取引詳細',
      viewInBlockRxplorer: 'ブロックエクスプローラーの表示',
      addNote: 'メモの追加',
      note: 'メモ',
      inputs: '入力',
      ouputs: '出力',
      sendCoins: 'コインを送金する',
      transactionType: '取引タイプ',
      transactioFee: '取引手数料',
      walletType: 'ウォレットタイプ',
      addToAddressBook: 'アドレス帳に追加',
      timePending: '保留期間',
    },
    label: {
      pending: '保留中',
      annulled: '無効化',
      done: '完了',
      canceled: 'キャンセル済み',
      unblocked: 'ブロック解除',
    },
    transactionTypeLabel: {
      standard: '標準',
      canceled: 'キャンセル済み',
      fast: 'クイック',
      secure: '安全な',
      secureFast: '安全で早い',
    },
    errors: {
      notEnoughBalance: '残高不足。少ない金額で試してください。',
    },
  },
  send: {
    header: 'コインを送金する',
    success: {
      title: '成功',
      description: '万歳！取引が完了しました。',
      done: '完了',
      return: 'ダッシュボードに戻る',
    },
    details: {
      title: '取引の作成',
      amount_field_is_not_valid: '金額フィールドが有効ではありません',
      fee_field_is_not_valid: '料金フィールドが有効ではありません',
      address_field_is_not_valid: 'アドレスフィールドが有効ではありません',
      create_tx_error: '取引作成中にエラーがありました。アドレスが有効であることを確認してください。',
      address: 'アドレス',
      amount_placeholder: '（BTCVの）送信する金額',
      fee_placeholder: '（BTCVの）追加取引のパスワードの手数料',
      note_placeholder: '個人メモ',
      cancel: 'キャンセル',
      scan: 'スキャン',
      send: '送金',
      next: '次へ',
      note: 'メモ（オプション）',
      to: '送信先',
      feeUnit: 'Sat/B',
      fee: '手数料：',
      create: 'インボイスの作成',
      remaining_balance: '残高',
      total_exceeds_balance: '送金する金額が利用可能な残高を上回っています。',
    },
    confirm: {
      sendNow: '今すぐ送金する',
      cancelNow: '今すぐキャンセル',
      availableBalance: '取引後の利用可能残高',
      pendingBalance: '取引後の保留残高',
    },
    create: {
      amount: '金額',
      fee: '手数料',
      setTransactionFee: '取引手数料の設定',
      headerText: 'ネットワークに多数の保留中の取引があるとき（1,500超）、より高い料金を支払うことにより、取引の処理速度が早くなります。通常は1～500 sat/bです',
    },
    recovery: {
      recover: 'キャンセル',
      useWalletAddress: 'このウォレットのアドレスを使用',
      confirmSeed: 'キャンセル・シードフレーズで確定する',
      confirmSeedDesc: 'お使いのウォレットの作成時に生成されたPDF文書を開き、秘密鍵のシードフレーズを同じ順序で書き留めます。',
      confirmFirstSeed: 'キャンセル・シードフレーズで確定する',
      confirmFirstSeedDesc: 'お使いのウォレットの作成時に生成された最初のPDF文書を開き、秘密鍵のシードフレーズを同じ順序で書き留めます。',
      confirmSecondSeed: 'クイック・シードフレーズで確定する',
      confirmSecondSeedDesc: 'お使いのウォレットの作成時に生成された2番目のPDF文書を開き、秘密鍵のシードフレーズを同じ順序で書き留めます。',
    },
    transaction: {
      instant: 'クイック',
      instantDesc: 'この取引は、ただちに確定されます。細心の注意を払った上でご利用ください。',
      fastSuccess: 'クイック取引が正常に完了しました。',
      alert: '標準',
      alertDesc: 'この取引を確認するには144ブロックもしくは約24時間が必要とされます。この間にキャンセルできます。',
      type: '取引タイプ',
      scanInstantKeyTitle: '迅速取引キーをスキャンする',
      scanInstantKeyDesc: 'ウォレットを作る際には生成したPDF文章を開いた後、個人キーQRコードをスキャンし取引を送ります。',
      lightningError: 'このアドレスはLightning送状用に表示されます。この送状について支払するにはLightningウォレットに移動してください。',
      watchOnlyError: '取引を送れないウォレットだけを表示する',
    },
    error: {
      title: 'エラー',
      description: '取引を生成する前にビットコインボルトウォレットを追加しなければなりません。',
    },
    warning: '警告: ',
    warningGeneral: '警告: 安全な取引機能の使用過程でお客様のウォレットの一部の資金がブロックされる可能性があります。これはUTXOやビットコインボルト・ウォレットのブロックチェーン範囲に関する一般的なプロセスです。取引が検証 されるか(約24時間後) キャンセルになると (24時間以内) 資金のブロックが解除されます。',
  },
  receive: {
    header: 'コインの受け取り',
    details: {
      amount: '金額',
      share: '共有',
      receiveWithAmount: '金額で受け取る ',
    },
  },
  settings: {
    language: '言語',
    general: '一般',
    security: 'セキュリティ',
    about: '紹介',
    electrumServer: 'Electrumサーバー',
    advancedOptions: '高級オプション',
    changePin: 'PIN変更',
    fingerprintLogin: '指紋ログイン',
    aboutUs: '当社紹介',
    header: '設定',
    notSupportedFingerPrint: '該当機器は指紋認識を支援しません。',
    TouchID: '指紋認識を許可する',
    FaceID: 'Face IDを許可する',
    Biometrics: '生体認証を許可する',
  },
  aboutUs: {
    header: '会社紹介',
    releaseNotes: 'リリースノート',
    runSelfTest: '自体テスト実行',
    buildWithAwesome: '素晴らしいビルド：',
    rateGoldWallet: 'ゴールドウォレットを評価する',
    goToOurGithub: '当社のGithubに移動する',
    alwaysBackupYourKeys: '常にキーをバックアップしてください。',
    title: 'ゴールドウォレットは無料でオープンソースのビットコインボルトウォレットです。許可されたMIT。\n',
  },
  electrumServer: {
    header: 'Electrumサーバー',
    title: 'Electrumサーバー変更',
    description: 'アプリケーションを連結するサーバーのアドレスを変更出来ます。基本アドレスを使用する事をお勧めします。',
    save: '保存する',
    useDefault: 'デフォルト値使用',
    host: 'ホスト',
    port: 'ポート',
    successfullSave: '変更事項が保存されました。変更事項を適用するには再起動が必要です。',
    connectionError: '提供されたElectrumサーバーに繋がりません。',
  },
  advancedOptions: {
    title: '高級オプション設定する',
    description: '高級オプション設定を通じて次のウォレットを選択出来ます：P2SH、 HD P2SH、 HD segwit',
  },
  selectLanguage: {
    header: '言語',
    restartInfo: '新しい言語を選択し変更事項を適用するにはGold Walletをやり直さなければなりません。',
    confirmation: '確認',
    confirm: '確認',
    alertDescription: '言語を選択し、アプリケーションを再起動しますか？',
    cancel: 'キャンセル',
  },
  contactList: {
    cancel: 'キャンセル',
    search: '検索する',
    screenTitle: 'アドレス帳',
    noContacts: '連絡先無し',
    noContactsDesc1: '表示する連絡先がありません。 \nクリック',
    noContactsDesc2: '１番目連絡先を追加します。',
    noResults: '次に関する結果がありません。',
  },
  contactCreate: {
    screenTitle: '新しい連絡先追加する',
    subtitle: '新しい連絡先',
    description: '新しい連絡先の名前とアドレスを入力してください。',
    nameLabel: '名前',
    addressLabel: 'アドレス',
    buttonLabel: '新しい連絡先を追加する',
    successTitle: '成功',
    successDescription: '万歳！新しい連絡先追加に成功しました。',
    successButton: 'アドレス帳に戻る',
    nameMissingAlphanumericCharacterError: 'TRANSLATION NEEDED | ENG: Name is missing alphanumeric character.',
    nameCannotContainSpecialCharactersError: 'TRANSLATION NEEDED | ENG: Name cannot contain special characters.',
  },
  contactDetails: {
    nameLabel: '名前',
    addressLabel: 'アドレス',
    editName: '名前修正',
    editAddress: 'アドレス修正',
    sendCoinsButton: 'コイン転送',
    showQRCodeButton: 'QRコードを表示する',
    deleteButton: '連絡先を削除する',
    share: '共有',
  },
  contactDelete: {
    title: '貴下の連絡先を削除してください。',
    header: '連絡先の削除',
    description1: '削除しますか',
    description2: '？\n後に削除をキャンセル出来ません。',
    no: 'いいえ',
    yes: 'はい',
    success: '成功',
    successDescription: '連絡先削除に成功しました。もうアドレス帳に戻れます。',
    successButton: 'アドレス帳に戻る',
  },
  scanQrCode: {
    permissionTitle: 'カメラを使用許容',
    permissionMessage: '貴下のカメラ使用について許容が必要です。',
    ok: '確認',
    cancel: 'キャンセル',
  },
  filterTransactions: {
    header: '取引分類',
    receive: '入金',
    send: '送金',
    filter: 'フィルター設定',
    to: '受領者',
    toAmount: '最大金額',
    toDate: '終了日',
    from: '送金者',
    fromAmount: '最小金額',
    fromDate: '開始日',
    clearFilters: 'フィルターを消す',
    received: '受領済み',
    sent: '送信済み',
    transactionType: '取引タイプ',
    transactionStatus: '取引状態',
    status: {
      pending: '保留中',
      annulled: '無効化',
      done: '完了',
      canceled: 'キャンセル済み',
      unblocked: 'ブロック解除',
    },
  },
  authenticators: {
    sign: {
      error: '認証システムは誰でも取引に署名出来ません。',
    },
    options: {
      title: '認証システムのオプション',
      export: '認証システムを共有する',
      pair: '認証システムのフェアリング',
      sectionTitle: '一般',
      delete: '認証システム削除',
    },
    pair: {
      title: '認証システムのフェアリング',
      pin: 'PIN',
      publicKey: '公開キー',
      descPin: 'このPINを使用し、デスクトップ応用プログラムに認証者フェアリングを確認します。',
      descPublicKey: 'Gold Walletオプションでウォレットを生成する間、この公開キーを使用し、デスクトップ応用プログラムに認証者を登録することができます。',
    },
    import: {
      title: '認証システムを登録する',
      success: '認証システムを読み込みました。これから使用できます。',
      subtitle: '認証システムを読み込む',
      desc1: 'シードフレーズの記録もしくは認証者のQRコードをスキャンします。',
      desc2: '下記“又はQRコードのスキャン\"をクリックし、QRコードをスキャンする',
      textAreaPlaceholder: 'シードフレーズ',
    },
    export: {
      title: '認証システムを共有する',
    },
    delete: {
      title: '認証システムの削除',
      subtitle: '認証システムの削除',
      success: '認証システムを削除しました。いつでも新しく登録できます。',
    },
    list: {
      noAuthenticatorsDesc1: 'タブ ',
      noAuthenticatorsDesc2: '1番目の認証者追加',
      noAuthenticators: '認証システム登録なし',
      scan: 'スキャン',
      title: 'Bitcoin Vault認証システム',
    },
    add: {
      successTitle: '認証システムが用意されました。',
      title: '新しい認証システム追加',
      subtitle: '認証システムのフェアリング',
      successDescription: '安全な所にこのシードフレーズを書き記してください。認証システムを復元する時必要です。迅速な取引及び取引のキャンセルを確認する時この認証システムが必要とされます。',
      description: 'Electrum Vaultデスクトップ応用プログラムを開いた後、新しいウォレットを作ります。QRコードが表示されるまで画面の段階に従います。続けるにはこのアプリを使用してスキャンしてください。',
      subdescription: '以下のオプションを選択し、認証システムを読み込むことができます。',
    },
    enterPIN: {
      subtitle: 'PIN入力',
      description: 'このPINをElectrum Vaultデスクトップ応用プログラムに入力し、フェアリングを完了します。\n',
    },
  },
  timeCounter: {
    title: '応用プログラムがブロックされました',
    description: 'ログインに失敗し、応用プログラムがブロックされました。後に再開してください。',
    tryAgain: 'もう一度お試してください',
    closeTheApp: '応用プログラムを閉じる',
  },
  security: {
    jailBrokenPhone: '貴下の装置が脱獄されたようです。この場合セキュリティ問題や衝突、その他様々な問題が発生する恐れがあります。脱獄された装置ではGoldWalletを使用しないようお願いします。',
    rootedPhone: '貴下の装置がルーティングされたようです。この場合セキュリティ問題や衝突、その他様々な問題が発生する恐れがあります。ルーティングされた装置ではGoldWalletを使用しないようお願いします。\n',
    title: 'セキュリティ問題',
    noPinOrFingerprintSet: 'デバイスにパスワード又は指紋が登録されていません。安全ではないデバイスでのGoldWallet使用はお勧めできません。',
  },
  betaVersion: {
    title: 'これはGoldWallletのベータバージョンです',
    description: 'まだ正式なリリース以前に最終テストを行っています。こちらに見せられる全てのコンテンツやモバイルアプリは\"そのまま\"と\"使用可能\"に基盤し提供されています。ソフトウェアの使用はユーザーのリスクを認識した上で行われます。',
    button: '私はリスクを認識しています',
  },
}
