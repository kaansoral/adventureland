import libraries.stripe3
from libraries.stripe3.test.helper import StripeResourceTest


class BalanceTest(StripeResourceTest):

    def test_retrieve_balance(self):
        libraries.stripe3.Balance.retrieve()

        self.requestor_mock.request.assert_called_with(
            'get',
            '/v1/balance',
            {},
            None
        )


class BalanceTransactionTest(StripeResourceTest):

    def test_list_balance_transactions(self):
        libraries.stripe3.BalanceTransaction.list()
        self.requestor_mock.request.assert_called_with(
            'get',
            '/v1/balance/history',
            {}
        )
