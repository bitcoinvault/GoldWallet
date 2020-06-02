import moment from 'moment';
import React, { Component } from 'react';
import { SectionList, SectionListData, StyleSheet, Text, View } from 'react-native';

import { images } from 'app/assets';
import { Image, TransactionItem } from 'app/components';
import { Route, Transaction } from 'app/consts';
import { NavigationService } from 'app/services';
import { palette, typography } from 'app/styles';

const i18n = require('../../../loc');

interface TransactionWithDay extends Transaction {
  day: moment.Moment;
  walletLabel: string;
  note: string;
}

interface Props {
  label: string;
  transactions: Transaction[];
  transactionNotes: Record<string, string>;
}

interface State {
  transactions: ReadonlyArray<SectionListData<TransactionWithDay>>;
}

export class TransactionList extends Component<Props, State> {
  state: State = {
    transactions: [],
  };

  static getDerivedStateFromProps(props: Props) {
    const groupedTransactions = [] as any;
    const dataToGroup = props.transactions
      .map((transaction: Transaction) => {
        const note = props.transactions.map(transactionWithNote => {
          if (transactionWithNote.hash == transaction.hash) {
            return transactionWithNote.note;
          }
          return '';
        })[0];
        return {
          ...transaction,
          day: moment(transaction.received).format('ll'),
          walletLabel: transaction.walletLabel || props.label,
          note,
        };
      })
      .sort((a: any, b: any) => b.time - a.time);

    const uniqueValues = [...new Set(dataToGroup.map((item: any) => item.day))].sort(
      (a: any, b: any) => new Date(b).getTime() - new Date(a).getTime(),
    );

    uniqueValues.map(uniqueValue =>
      groupedTransactions.push({
        title: uniqueValue,
        data: dataToGroup.filter((transaction: any) => transaction.day === uniqueValue),
      }),
    );
    return {
      transactions: groupedTransactions,
    };
  }

  renderSectionTitle = ({ section }: { section: any }) => {
    return (
      <View style={{ marginTop: 30, marginBottom: 10 }}>
        <Text style={{ ...typography.caption, color: palette.textGrey }}>{section.title}</Text>
      </View>
    );
  };

  onTransactionItemPress = (item: Transaction) => {
    NavigationService.navigate(Route.TransactionDetails, { transaction: item });
  };

  renderListEmpty = () => {
    return (
      <View style={styles.noTransactionsContainer}>
        <Image source={images.noTransactions} style={styles.noTransactionsImage} />
        <Text style={styles.noTransactionsLabel}>{i18n.wallets.dashboard.noTransactions}</Text>
      </View>
    );
  };

  render() {
    return (
      <View style={{ padding: 20 }}>
        <SectionList
          sections={this.state.transactions}
          keyExtractor={(item, index) => `${item.txid}-${index}`}
          renderItem={item => <TransactionItem item={item.item} onPress={this.onTransactionItemPress} />}
          renderSectionHeader={this.renderSectionTitle}
          ListEmptyComponent={this.renderListEmpty}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  noTransactionsContainer: {
    alignItems: 'center',
  },
  noTransactionsImage: { height: 167, width: 167, marginVertical: 30 },
  noTransactionsLabel: {
    ...typography.caption,
    color: palette.textGrey,
  },
});
