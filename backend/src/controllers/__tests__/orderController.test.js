const mongoose = require("mongoose");

jest.mock("../../models/Product");
jest.mock("../../models/Order");
jest.mock("../../models/User");
jest.mock("../../models/Coupon");
jest.mock("../../models/CouponRedemption");
jest.mock("../../services/razorpayService", () => ({
  createPaymentOrder: jest.fn(),
  getRazorpayKeyId: jest.fn(() => "rzp_test"),
  verifyPaymentSignature: jest.fn(),
  verifyWebhookSignature: jest.fn(),
}));
jest.mock("../../services/googleDirectionsService", () => ({
  fetchDrivingRouteEncodedPolyline: jest.fn(),
  getDirectionsApiKey: jest.fn(),
}));

const Product = require("../../models/Product");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Coupon = require("../../models/Coupon");
const CouponRedemption = require("../../models/CouponRedemption");
const { verifyPaymentSignature } = require("../../services/razorpayService");
const {
  createOrder,
  validateCouponForCart,
  verifyPayment,
  reorderMyOrder,
} = require("../orderController");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("orderController", () => {
  const userId = new mongoose.Types.ObjectId();
  const productId = new mongoose.Types.ObjectId();

  const shippingAddress = {
    fullName: "E2E User",
    phone: "9876543210",
    line1: "12 Test Lane",
    city: "Mumbai",
    state: "MH",
    postalCode: "400001",
    country: "India",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    CouponRedemption.exists = jest.fn().mockResolvedValue(null);
  });

  test("order creation with valid cart succeeds (COD)", async () => {
    const savedOrder = {
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      products: [],
      totalPrice: 500,
      status: "pending",
      paymentMethod: "Cash on Delivery",
      invoice: {},
      razorpay: {},
      save: jest.fn().mockResolvedValue(undefined),
    };

    Product.find.mockResolvedValue([
      {
        _id: productId,
        name: "Ghee",
        price: 499,
        image: "",
        inStock: true,
        stockQty: 10,
        variants: [],
      },
    ]);
    const populatedOrder = {
      ...savedOrder,
      toObject: () => ({
        _id: savedOrder._id,
        totalPrice: 500,
        status: "pending",
        paymentMethod: "Cash on Delivery",
      }),
    };
    Order.create.mockResolvedValue(savedOrder);
    Order.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(populatedOrder),
        }),
      }),
    });
    User.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    Coupon.findOne.mockResolvedValue(null);

    const req = {
      user: { _id: userId },
      body: {
        products: [{ product: String(productId), quantity: 1 }],
        shippingAddress,
        paymentMethod: "Cash on Delivery",
      },
    };
    const res = mockRes();
    const next = jest.fn();

    await createOrder(req, res, next);

    expect(Order.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("order creation with invalid coupon returns error message", async () => {
    Product.find.mockResolvedValue([
      { _id: productId, name: "Ghee", price: 499, image: "", variants: [] },
    ]);
    Coupon.findOne.mockResolvedValue({
      code: "BAD",
      type: "percent",
      value: 10,
      isActive: false,
      minOrderAmount: 0,
    });

    const req = {
      user: { _id: userId },
      body: {
        products: [{ product: String(productId), quantity: 1 }],
        shippingAddress,
        paymentMethod: "Cash on Delivery",
        couponCode: "bad",
      },
    };
    const res = mockRes();

    await createOrder(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/inactive/i) }));
    expect(Order.create).not.toHaveBeenCalled();
  });

  test("validateCouponForCart rejects inactive coupon", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: userId, cartItems: [{ price: 100, quantity: 2 }] }),
    });
    Coupon.findOne.mockResolvedValue({
      code: "OFF",
      type: "percent",
      value: 10,
      isActive: false,
      minOrderAmount: 0,
      isVisibleToUsers: true,
    });

    const req = {
      user: { _id: userId },
      body: { couponCode: "off", subtotal: 200 },
    };
    const res = mockRes();

    await validateCouponForCart(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ valid: false, message: expect.stringMatching(/inactive/i) })
    );
  });

  test("verifyPayment rejects bad Razorpay signature", async () => {
    verifyPaymentSignature.mockReturnValue(false);
    const orderId = new mongoose.Types.ObjectId();
    const order = {
      _id: orderId,
      user: userId,
      paymentMethod: "Razorpay",
      paymentStatus: "pending",
      razorpay: { orderId: "order_rzp" },
      save: jest.fn().mockResolvedValue(undefined),
    };
    Order.findById.mockResolvedValue(order);

    const req = {
      params: { id: String(orderId) },
      user: { _id: userId },
      body: {
        razorpay_order_id: "order_rzp",
        razorpay_payment_id: "pay_bad",
        razorpay_signature: "sig_bad",
      },
    };
    const res = mockRes();

    await verifyPayment(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/signature verification failed/i) })
    );
    expect(order.paymentStatus).toBe("failed");
  });

  test("reorder copies line items into cart without payment fields", async () => {
    const orderId = new mongoose.Types.ObjectId();
    const liveProduct = {
      _id: productId,
      name: "Ghee",
      price: 499,
      image: "img.jpg",
      inStock: true,
      stockQty: 5,
      variants: [],
    };

    Order.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: orderId,
        user: userId,
        products: [
          {
            product: liveProduct,
            name: "Ghee",
            price: 499,
            quantity: 2,
            variantLabel: "",
          },
        ],
        shippingAddress,
        paymentMethod: "Razorpay",
        paymentStatus: "paid",
      }),
    });

    const userDoc = {
      _id: userId,
      cartItems: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findById.mockResolvedValue(userDoc);

    const req = { params: { id: String(orderId) }, user: { _id: userId } };
    const res = mockRes();

    await reorderMyOrder(req, res, () => {});

    expect(userDoc.cartItems).toHaveLength(1);
    expect(userDoc.cartItems[0].product).toEqual(productId);
    expect(userDoc.cartItems[0].quantity).toBe(2);
    expect(userDoc.cartItems[0].price).toBe(499);
    expect(userDoc.paymentStatus).toBeUndefined();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/added to cart/i),
        addedItems: expect.arrayContaining([expect.objectContaining({ name: "Ghee" })]),
      })
    );
  });
});
