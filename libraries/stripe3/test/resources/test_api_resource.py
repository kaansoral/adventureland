import libraries.stripe3
from libraries.stripe3.test.helper import (
    StripeApiTestCase, MyResource, MySingleton
)


class APIResourceTests(StripeApiTestCase):

    def test_retrieve_and_refresh(self):
        self.mock_response({
            'id': 'foo2',
            'bobble': 'scrobble',
        })

        res = MyResource.retrieve('foo*', myparam=5)

        url = '/v1/myresources/foo%2A'
        self.requestor_mock.request.assert_called_with(
            'get', url, {'myparam': 5}, None
        )

        self.assertEqual('scrobble', res.bobble)
        self.assertEqual('foo2', res.id)
        self.assertEqual('reskey', res.api_key)

        self.mock_response({
            'frobble': 5,
        })

        res = res.refresh()

        url = '/v1/myresources/foo2'
        self.requestor_mock.request.assert_called_with(
            'get', url, {'myparam': 5}, None
        )

        self.assertEqual(5, res.frobble)
        self.assertRaises(KeyError, res.__getitem__, 'bobble')

    def test_convert_to_stripe_object(self):
        sample = {
            'foo': 'bar',
            'adict': {
                'object': 'charge',
                'id': 42,
                'amount': 7,
            },
            'alist': [
                {
                    'object': 'customer',
                    'name': 'chilango'
                }
            ]
        }

        converted = libraries.stripe3.resource.convert_to_stripe_object(
            sample, 'akey', None)

        # Types
        self.assertTrue(isinstance(converted, libraries.stripe3.resource.StripeObject))
        self.assertTrue(isinstance(converted.adict, libraries.stripe3.Charge))
        self.assertEqual(1, len(converted.alist))
        self.assertTrue(isinstance(converted.alist[0], libraries.stripe3.Customer))

        # Values
        self.assertEqual('bar', converted.foo)
        self.assertEqual(42, converted.adict.id)
        self.assertEqual('chilango', converted.alist[0].name)

        # Stripping
        # TODO: We should probably be stripping out this property
        # self.assertRaises(AttributeError, getattr, converted.adict, 'object')


class SingletonAPIResourceTests(StripeApiTestCase):

    def test_retrieve(self):
        self.mock_response({
            'single': 'ton'
        })
        res = MySingleton.retrieve()

        self.requestor_mock.request.assert_called_with(
            'get', '/v1/mysingleton', {}, None)

        self.assertEqual('ton', res.single)
