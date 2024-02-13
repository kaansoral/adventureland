import libraries.stripe3
from libraries.stripe3.test.helper import StripeResourceTest


class CountrySpecTest(StripeResourceTest):

    def test_country_spec_list(self):
        libraries.stripe3.CountrySpec.list()
        self.requestor_mock.request.assert_called_with(
            'get',
            '/v1/country_specs',
            {}
        )

    def test_country_spec_retrieve(self):
        libraries.stripe3.CountrySpec.retrieve('US')

        self.requestor_mock.request.assert_called_with(
            'get',
            '/v1/country_specs/US',
            {},
            None
        )
