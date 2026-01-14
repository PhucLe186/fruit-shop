import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { DOMAIN_SERVER } from "../../config/constants";
import { useAuth } from "../../contexts/AuthContext";

const Cart = () => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const setCookie = (name, value, days = 30) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  };

  const loadCartFromCookie = async () => {
    try {
      const cartCookie = getCookie("cart");
      if (!cartCookie) {
        setCartItems([]);
        return;
      }

      const cart = JSON.parse(decodeURIComponent(cartCookie));
      if (!Array.isArray(cart) || cart.length === 0) {
        setCartItems([]);
        return;
      }

      const updatedCart = [];
      for (const cartItem of cart) {
        try {
          const productIdentifier = cartItem.slug || cartItem._id;
          const res = await axios.get(
            `${DOMAIN_SERVER}/api/product/${productIdentifier}`
          );
          let productData = null;
          if (res.data && res.data._id) {
            productData = res.data;
          } else if (res.data && res.data.data && res.data.data._id) {
            productData = res.data.data;
          }

          if (
            productData &&
            productData.status === "active" &&
            !productData.deleted
          ) {
            updatedCart.push({
              _id: productData._id,
              slug: productData.slug,
              name: productData.name,
              price: productData.price,
              discount: productData.discount || 0,
              image:
                productData.images && productData.images.length > 0
                  ? productData.images[0].url
                  : null,
              quantity: cartItem.quantity || 1,
            });
          }
        } catch (error) {
          continue;
        }
      }

      setCartItems(updatedCart);
    } catch (error) {
      setCartItems([]);
    }
  };

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const loadCartFromServer = async () => {
    try {
      const token = getToken();
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.get(`${DOMAIN_SERVER}/api/cart`, {
        withCredentials: true,
        headers: headers,
      });

      if (res.data.success && res.data.data && res.data.data.info_product) {
        const cartItemsList = [];
        for (const item of res.data.data.info_product) {
          if (item.product && item.product._id) {
            const product = item.product;
            cartItemsList.push({
              _id: product._id,
              slug: product.slug,
              name: product.name,
              price: item.price || product.price || 0,
              discount: item.discount || product.discount || 0,
              image:
                product.images && product.images.length > 0
                  ? product.images[0].url
                  : null,
              quantity: item.quantity || 1,
            });
          }
        }
        setCartItems(cartItemsList);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error loading cart from server:", error);
      setCartItems([]);
    }
  };

  const loadCart = async () => {
    setLoading(true);
    if (!user) {
      await loadCartFromCookie();
    } else {
      await loadCartFromServer();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const updateCartLocal = (updatedCart) => {
    setCookie("cart", encodeURIComponent(JSON.stringify(updatedCart)));
    setCartItems(updatedCart);
  };

  const updateQuantityLocal = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItemLocal(productId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    updateCartLocal(updatedCart);
  };

  const updateQuantityServer = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeItemServer(productId);
      return;
    }

    try {
      const item = cartItems.find((item) => item._id === productId);
      if (!item) return;

      const price = item.price || 0;
      const discount = item.discount || 0;
      const priceAfterDiscount = price - (price * discount) / 100;
      const total = priceAfterDiscount * newQuantity;

      const info_product = [
        {
          product: productId,
          quantity: newQuantity,
          price: price,
          discount: discount,
          total: total,
        },
      ];

      const token = getToken();
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await axios.post(
        `${DOMAIN_SERVER}/api/cart/create`,
        { info_product },
        { 
          withCredentials: true,
          headers: headers,
        }
      );

      if (res.data.success) {
        const updatedCart = cartItems.map((item) =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedCart);
      } else {
        await loadCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      await loadCart();
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (!user) {
      updateQuantityLocal(productId, newQuantity);
    } else {
      updateQuantityServer(productId, newQuantity);
    }
  };

  const removeItemLocal = (productId) => {
    Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedCart = cartItems.filter((item) => item._id !== productId);
        updateCartLocal(updatedCart);

        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: "Sản phẩm đã được xóa khỏi giỏ hàng",
          timer: 1500,
          timerProgressBar: true,
        });
      }
    });
  };

  const removeItemServer = async (productId) => {
    Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = getToken();
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const res = await axios.patch(
            `${DOMAIN_SERVER}/api/cart/delete-product`,
            { productId },
            { 
              withCredentials: true,
              headers: headers,
            }
          );

          if (res.data.success) {
            if (res.data.data && res.data.data.info_product) {
              const cartItemsList = [];
              for (const item of res.data.data.info_product) {
                if (item.product && item.product._id) {
                  const product = item.product;
                  cartItemsList.push({
                    _id: product._id,
                    name: product.name,
                    price: item.price || product.price || 0,
                    discount: item.discount || product.discount || 0,
                    image:
                      product.images && product.images.length > 0
                        ? product.images[0].url
                        : null,
                    quantity: item.quantity || 1,
                  });
                }
              }
              setCartItems(cartItemsList);
            } else {
              await loadCart();
            }

            Swal.fire({
              icon: "success",
              title: "Đã xóa!",
              text: res.data.message || "Sản phẩm đã được xóa khỏi giỏ hàng",
              timer: 1500,
              timerProgressBar: true,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Lỗi!",
              text: res.data.message || "Không thể xóa sản phẩm",
            });
          }
        } catch (error) {
          console.error("Error removing item:", error);
          const errorMessage =
            error.response?.data?.message || "Không thể xóa sản phẩm";
          Swal.fire({
            icon: "error",
            title: "Lỗi!",
            text: errorMessage,
          });
        }
      }
    });
  };

  const removeItem = (productId) => {
    if (!user) {
      removeItemLocal(productId);
    } else {
      removeItemServer(productId);
    }
  };

  const clearCart = () => {
    Swal.fire({
      title: "Xác nhận xóa tất cả",
      text: "Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Xóa tất cả",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (!user) {
          setCookie("cart", "");
          setCartItems([]);
        } else {
          try {
            const info_product = cartItems.map((item) => ({
              product: item._id,
              quantity: 0,
              price: item.price || 0,
              discount: item.discount || 0,
              total: 0,
            }));

            const token = getToken();
            const headers = {};
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }

            await axios.post(
              `${DOMAIN_SERVER}/api/cart/create`,
              { info_product },
              { 
                withCredentials: true,
                headers: headers,
              }
            );
            await loadCart();
          } catch (error) {
            console.error("Error clearing cart:", error);
          }
        }

        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: "Giỏ hàng đã được làm trống",
          timer: 1500,
          timerProgressBar: true,
        });
      }
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.quantity || 1);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="breadcrumb-section pt-0">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb-contain">
                <h2>Giỏ hàng</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/">
                        <i className="fa-solid fa-house" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item active">Giỏ hàng</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="cart-section section-b-space">
        <div className="container-fluid-lg">
          {cartItems.length === 0 ? (
            <div className="row">
              <div className="col-12">
                <div className="text-center py-5">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Giỏ hàng trống</h3>
                  <p className="mt-2 text-sm text-gray-500">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                  <Link
                    to="/"
                    className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Mua sắm ngay
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="row g-sm-5 g-3">
              <div className="col-xxl-9">
                <div className="cart-table">
                  <div className="table-responsive-xl">
                    <table className="table">
                      <tbody>
                        {cartItems.map((item) => {
                          const price = item.price || 0;
                          const discount = item.discount || 0;
                          const priceAfterDiscount = price - (price * discount) / 100;
                          const saving = price - priceAfterDiscount;
                          const itemTotal = priceAfterDiscount * (item.quantity || 1);
                          const savingTotal = saving * (item.quantity || 1);

                          return (
                            <tr key={item._id} className="product-box-contain">
                              <td className="product-detail">
                                <div className="product border-0">
                                  <Link
                                    to={`/${item.slug || item._id}`}
                                    className="product-image"
                                  >
                                    {item.image ? (
                                      <img
                                        src={item.image}
                                        className="img-fluid blur-up lazyloaded"
                                        alt={item.name}
                                      />
                                    ) : (
                                      <div className="w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                  </Link>
                                  <div className="product-detail">
                                    <ul>
                                      <li className="name">
                                        <Link to={`/${item.slug || item._id}`}>
                                          {item.name}
                                        </Link>
                                      </li>
                                      
                                    </ul>
                                  </div>
                                </div>
                              </td>
                              <td className="price">
                                <h4 className="table-title text-content">Giá</h4>
                                <h5>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceAfterDiscount)}
                                  {discount > 0 && (
                                    <del className="text-content">
                                      {" "}
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                                    </del>
                                  )}
                                </h5>
                                {discount > 0 && (
                                  <h6 className="theme-color">
                                    Bạn tiết kiệm : {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(saving)}
                                  </h6>
                                )}
                              </td>
                              <td className="quantity">
                                <h4 className="table-title text-content">Số lượng</h4>
                                <div className="quantity-price">
                                  <div className="cart_qty">
                                    <div className="input-group">
                                      <button
                                        type="button"
                                        className="btn qty-left-minus"
                                        onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                                      >
                                        <i className="fa fa-minus ms-0" />
                                      </button>
                                      <input
                                        className="form-control input-number qty-input"
                                        type="text"
                                        name="quantity"
                                        value={item.quantity || 1}
                                        readOnly
                                      />
                                      <button
                                        type="button"
                                        className="btn qty-right-plus"
                                        onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                                      >
                                        <i className="fa fa-plus ms-0" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="subtotal">
                                <h4 className="table-title text-content">Tổng</h4>
                                <h5>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemTotal)}
                                </h5>
                              </td>
                              <td className="save-remove">
                                <h4 className="table-title text-content">Thao tác</h4>
                                <a
                                  className="remove close_button"
                                  href="javascript:void(0)"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeItem(item._id);
                                  }}
                                >
                                  Xóa
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-xxl-3">
                <div className="summery-box p-sticky">
                  <div className="summery-header">
                    <h3>Tổng giỏ hàng</h3>
                  </div>
                  <div className="summery-contain">
                    <ul>
                      <li>
                        <h4>Tạm tính</h4>
                        <h4 className="price">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                        </h4>
                      </li>
                      <li className="align-items-start">
                        <h4>Phí vận chuyển</h4>
                        <h4 className="price text-end">Miễn phí</h4>
                      </li>
                    </ul>
                  </div>
                  <ul className="summery-total">
                    <li className="list-total border-top-0">
                      <h4>Tổng cộng (VND)</h4>
                      <h4 className="price theme-color">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                      </h4>
                    </li>
                  </ul>
                  <div className="button-group cart-button">
                    <ul>
                      <li>
                        <Link
                          to="/checkout"
                          className="btn btn-animation proceed-btn fw-bold"
                        >
                          Tiến hành thanh toán
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/"
                          className="btn btn-light shopping-button text-dark"
                        >
                          <i className="fa-solid fa-arrow-left-long" />
                          Quay lại mua sắm
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

    </>
  );
};

export default Cart;
