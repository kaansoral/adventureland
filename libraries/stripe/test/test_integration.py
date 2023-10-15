# -*- coding: utf-8 -*-
import os
import sys
import unittest2
import libraries.stripe

from mock import patch
from libraries.stripe.test.helper import (StripeTestCase, NOW, DUMMY_CHARGE, DUMMY_CARD)


class FunctionalTests(StripeTestCase):
    request_client = libraries.stripe.http_client.Urllib2Client

    def setUp(self):
        super(FunctionalTests, self).setUp()

        def get_http_client(*args, **kwargs):
            return self.request_client(*args, **kwargs)

        self.client_patcher = patch(
            'stripe.http_client.new_default_http_client')

        client_mock = self.client_patcher.start()
        client_mock.side_effect = get_http_client

    def tearDown(self):
        super(FunctionalTests, self).tearDown()

        self.client_patcher.stop()

    def test_dns_failure(self):
        api_base = libraries.stripe.api_base
        try:
            libraries.stripe.api_base = 'https://my-invalid-domain.ireallywontresolve/v1'
            self.assertRaises(stripe.error.APIConnectionError,
                              libraries.stripe.Customer.create)
        finally:
            libraries.stripe.api_base = api_base

    def test_run(self):
        charge = libraries.stripe.Charge.create(**DUMMY_CHARGE)
        self.assertFalse(charge.refunded)
        charge.refund()
        self.assertTrue(charge.refunded)

    def test_refresh(self):
        charge = libraries.stripe.Charge.create(**DUMMY_CHARGE)
        charge2 = libraries.stripe.Charge.retrieve(charge.id)
        self.assertEqual(charge2.created, charge.created)

        charge2.junk = 'junk'
        charge2.refresh()
        self.assertRaises(AttributeError, lambda: charge2.junk)

    def test_list_accessors(self):
        customer = libraries.stripe.Customer.create(card=DUMMY_CARD)
        self.assertEqual(customer['created'], customer.created)
        customer['foo'] = 'bar'
        self.assertEqual(customer.foo, 'bar')

    def test_raise(self):
        EXPIRED_CARD = DUMMY_CARD.copy()
        EXPIRED_CARD['exp_month'] = NOW.month - 2
        EXPIRED_CARD['exp_year'] = NOW.year - 2
        self.assertRaises(stripe.error.CardError, libraries.stripe.Charge.create,
                          amount=100, currency='usd', card=EXPIRED_CARD)

    def test_response_headers(self):
        EXPIRED_CARD = DUMMY_CARD.copy()
        EXPIRED_CARD['exp_month'] = NOW.month - 2
        EXPIRED_CARD['exp_year'] = NOW.year - 2
        try:
            libraries.stripe.Charge.create(amount=100, currency='usd', card=EXPIRED_CARD)
            self.fail('charge creation with expired card did not fail')
        except libraries.stripe.error.CardError as e:
            self.assertTrue(e.request_id.startswith('req_'))

    def test_unicode(self):
        # Make sure unicode requests can be sent
        self.assertRaises(stripe.error.InvalidRequestError,
                          libraries.stripe.Charge.retrieve,
                          id=u'☃')

    def test_none_values(self):
        customer = libraries.stripe.Customer.create(plan=None)
        self.assertTrue(customer.id)

    def test_missing_id(self):
        customer = libraries.stripe.Customer()
        self.assertRaises(stripe.error.InvalidRequestError, customer.refresh)


class RequestsFunctionalTests(FunctionalTests):
    request_client = libraries.stripe.http_client.RequestsClient


class UrlfetchFunctionalTests(FunctionalTests):
    request_client = 'urlfetch'

    def setUp(self):
        if libraries.stripe.http_client.urlfetch is None:
            self.skipTest(
                '`urlfetch` from Google App Engine is unavailable.')
        else:
            super(UrlfetchFunctionalTests, self).setUp()


class PycurlFunctionalTests(FunctionalTests):

    def setUp(self):
        if not os.environ.get('STRIPE_TEST_PYCURL'):
            self.skipTest('Pycurl skipped as STRIPE_TEST_PYCURL is not set')
        if sys.version_info >= (3, 0):
            self.skipTest('Pycurl is not supported in Python 3')
        else:
            super(PycurlFunctionalTests, self).setUp()

    request_client = libraries.stripe.http_client.PycurlClient


class AuthenticationErrorTest(StripeTestCase):

    def test_invalid_credentials(self):
        key = libraries.stripe.api_key
        try:
            libraries.stripe.api_key = 'invalid'
            libraries.stripe.Customer.create()
        except libraries.stripe.error.AuthenticationError as e:
            self.assertEqual(401, e.http_status)
            self.assertTrue(isinstance(e.http_body, basestring))
            self.assertTrue(isinstance(e.json_body, dict))
            # Note that an invalid API key bypasses many of the standard
            # facilities in the API server so currently no Request ID is
            # returned.
        finally:
            libraries.stripe.api_key = key


class CardErrorTest(StripeTestCase):

    def test_declined_card_props(self):
        EXPIRED_CARD = DUMMY_CARD.copy()
        EXPIRED_CARD['exp_month'] = NOW.month - 2
        EXPIRED_CARD['exp_year'] = NOW.year - 2
        try:
            libraries.stripe.Charge.create(amount=100, currency='usd', card=EXPIRED_CARD)
        except libraries.stripe.error.CardError as e:
            self.assertEqual(402, e.http_status)
            self.assertTrue(isinstance(e.http_body, basestring))
            self.assertTrue(isinstance(e.json_body, dict))
            self.assertTrue(e.request_id.startswith('req_'))


class InvalidRequestErrorTest(StripeTestCase):

    def test_nonexistent_object(self):
        try:
            libraries.stripe.Charge.retrieve('invalid')
        except libraries.stripe.error.InvalidRequestError as e:
            self.assertEqual(404, e.http_status)
            self.assertTrue(isinstance(e.http_body, basestring))
            self.assertTrue(isinstance(e.json_body, dict))
            self.assertTrue(e.request_id.startswith('req_'))

    def test_invalid_data(self):
        try:
            libraries.stripe.Charge.create()
        except libraries.stripe.error.InvalidRequestError as e:
            self.assertEqual(400, e.http_status)
            self.assertTrue(isinstance(e.http_body, basestring))
            self.assertTrue(isinstance(e.json_body, dict))
            self.assertTrue(e.request_id.startswith('req_'))


if __name__ == '__main__':
    unittest2.main()
