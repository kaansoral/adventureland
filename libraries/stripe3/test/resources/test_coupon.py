import libraries.stripe3
from libraries.stripe3.test.helper import (
    StripeResourceTest, DUMMY_COUPON
)


class CouponTest(StripeResourceTest):

    def test_create_coupon(self):
        libraries.stripe3.Coupon.create(**DUMMY_COUPON)
        self.requestor_mock.request.assert_called_with(
            'post',
            '/v1/coupons',
            DUMMY_COUPON,
            None
        )

    def test_update_coupon(self):
        coup = libraries.stripe3.Coupon.construct_from({
            'id': 'cu_update',
            'metadata': {},
        }, 'api_key')
        coup.metadata["key"] = "value"
        coup.save()

        self.requestor_mock.request.assert_called_with(
            'post',
            "/v1/coupons/cu_update",
            {
                'metadata': {
                    'key': 'value',
                }
            },
            None
        )

    def test_delete_coupon(self):
        c = libraries.stripe3.Coupon(id='cu_delete')
        c.delete()

        self.requestor_mock.request.assert_called_with(
            'delete',
            '/v1/coupons/cu_delete',
            {},
            None
        )

    def test_detach_coupon(self):
        customer = libraries.stripe3.Customer(id="cus_delete_discount")
        customer.delete_discount()

        self.requestor_mock.request.assert_called_with(
            'delete',
            '/v1/customers/cus_delete_discount/discount',
        )
