import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DOMAIN_SERVER } from '../../config/constants';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState({});

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const setCookie = (name, value, days = 30) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  };

  const loadCart = async () => {
    if (!user) {
      const cartCookie = getCookie("cart");
      if (cartCookie) {
        try {
          const cart = JSON.parse(decodeURIComponent(cartCookie));
          const cartMap = {};
          cart.forEach((item) => {
            cartMap[item._id] = item.quantity || 1;
          });
          setCartItems((prev) => ({ ...prev, ...cartMap }));
        } catch (error) {
          console.error("Error parsing cart cookie:", error);
        }
      } else {
        setCartItems({});
      }
      return;
    }

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
        const cartMap = {};
        res.data.data.info_product.forEach((item) => {
          if (item.product && item.product._id) {
            cartMap[item.product._id] = item.quantity || 1;
          }
        });
        setCartItems((prev) => ({ ...prev, ...cartMap }));
      } else {
        setCartItems((prev) => prev);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const updateCartQuantity = async (product, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => {
        const updated = { ...prev };
        delete updated[product._id];
        return updated;
      });
    } else {
      setCartItems((prev) => ({
        ...prev,
        [product._id]: newQuantity,
      }));
    }

    if (!user) {
      const cartCookie = getCookie("cart");
      let cart = [];
      if (cartCookie) {
        cart = JSON.parse(decodeURIComponent(cartCookie));
      }
      const existingIndex = cart.findIndex((item) => item._id === product._id);
      if (existingIndex >= 0) {
        if (newQuantity <= 0) {
          cart.splice(existingIndex, 1);
        } else {
          cart[existingIndex].quantity = newQuantity;
        }
      } else if (newQuantity > 0) {
        cart.push({
          _id: product._id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0].url : null,
          quantity: newQuantity,
        });
      }
      setCookie("cart", encodeURIComponent(JSON.stringify(cart)));
      return;
    }

    try {
      const price = product.price || 0;
      const discount = product.discount || 0;
      const priceAfterDiscount = price - (price * discount / 100);
      const total = priceAfterDiscount * newQuantity;

      const info_product = [{
        product: product._id,
        quantity: newQuantity,
        price: price,
        discount: discount,
        total: total,
      }];

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
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  const addToCart = async (e, product) => {
    e.stopPropagation();
    if (user) {
      try {
        const price = product.price || 0;
        const discount = product.discount || 0;
        const priceAfterDiscount = price - (price * discount / 100);
        const quantity = 1;
        const total = priceAfterDiscount * quantity;

        const info_product = [{
          product: product._id,
          quantity: quantity,
          price: price,
          discount: discount,
          total: total,
        }];

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
          setCartItems((prev) => ({
            ...prev,
            [product._id]: quantity,
          }));
          
          Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: res.data.message || "Đã thêm sản phẩm vào giỏ hàng",
            confirmButtonText: "OK",
            confirmButtonColor: "#28a745",
            timer: 2000,
            timerProgressBar: true,
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi!",
            text: res.data.message || "Không thể thêm sản phẩm vào giỏ hàng",
            confirmButtonText: "OK",
            confirmButtonColor: "#dc3545",
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "Không thể thêm sản phẩm vào giỏ hàng";
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: errorMessage,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    } else {
      try {
        const cartCookie = getCookie("cart");
        let cart = [];
        
        if (cartCookie) {
          cart = JSON.parse(decodeURIComponent(cartCookie));
        }
        
        const existingIndex = cart.findIndex((item) => item._id === product._id);
        
        if (existingIndex >= 0) {
          cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        } else {
          cart.push({
            _id: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image:
              product.images && product.images.length > 0
                ? product.images[0].url
                : null,
            quantity: 1,
          });
        }

        setCookie("cart", encodeURIComponent(JSON.stringify(cart)));
        const newQuantity = cart.find((item) => item._id === product._id)?.quantity || 1;
        setCartItems((prev) => ({
          ...prev,
          [product._id]: newQuantity,
        }));
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã thêm sản phẩm vào giỏ hàng",
          confirmButtonText: "OK",
          confirmButtonColor: "#28a745",
          timer: 2000,
          timerProgressBar: true,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không thể thêm sản phẩm vào giỏ hàng",
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const handleQuantityChange = async (e, product, change) => {
    e.stopPropagation();
    const currentQuantity = cartItems[product._id] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    await updateCartQuantity(product, newQuantity);
  };

  useEffect(() => {
    fetchCategoryData();
    loadCart();
  }, [slug, user]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      if (window.feather) {
        window.feather.replace();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, products]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN_SERVER}/api/category/${slug}`);
      
      if (res.data.success) {
        setCategory(res.data.category);
        setProducts(res.data.products || []);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không tìm thấy danh mục',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          navigate('/');
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải dữ liệu danh mục',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      }).then(() => {
        navigate('/');
      });
    } finally {
      setLoading(false);
    }
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
                <h2>{category?.name || 'Danh mục'}</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <a href="/" onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                      }}>
                        Trang chủ
                      </a>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {category?.name || 'Danh mục'}
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section">
        <div className="container-fluid-lg">
          <div className="row g-sm-4 g-3">
            <div className="col-12">
              <div className="product-header">
                <div className="product-header-content">
                  <h3>{category?.name || 'Danh mục'}</h3>
                  <p className="text-content">
                    {products.length} sản phẩm
                  </p>
                </div>
              </div>
            </div>
            <div className="col-12">
              {products.length === 0 ? (
                <div className="text-center py-5">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Không có sản phẩm</h3>
                  <p className="mt-2 text-sm text-gray-500">Danh mục này hiện chưa có sản phẩm nào</p>
                </div>
              ) : (
                <div className="row g-sm-4 g-3 row-cols-xxl-4 row-cols-xl-3 row-cols-lg-2 row-cols-md-3 row-cols-2">
                  {products.map((product) => {
                    const price = product.price || 0;
                    const discount = product.discount || 0;
                    const priceAfterDiscount = price - (price * discount / 100);
                    const productImage = product.images && product.images.length > 0 ? product.images[0].url : null;
                    const categoryName = product.category && typeof product.category === 'object' ? product.category.name : (product.category || '');
                    const hasQuantity = cartItems[product._id] && cartItems[product._id] > 0;

                    return (
                      <div key={product._id} className="col">
                        <div className="product-box">
                          <div className="product-image">
                            <a href={`/${product.slug}`} onClick={(e) => {
                              e.preventDefault();
                              navigate(`/${product.slug}`);
                            }}>
                              {productImage ? (
                                <img
                                  src={productImage}
                                  className="img-fluid blur-up lazyload"
                                  alt={product.name}
                                />
                              ) : (
                                <img
                                  src="/assets/images/vegetable/product/1.png"
                                  className="img-fluid blur-up lazyload"
                                  alt={product.name}
                                />
                              )}
                            </a>
                            {categoryName && (
                              <div className="product-category-tag">
                                <span>{categoryName}</span>
                              </div>
                            )}
                            <ul className="product-option">
                              <li data-bs-toggle="tooltip" data-bs-placement="top" title="Xem">
                                <a href={`/${product.slug}`} onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/${product.slug}`);
                                }}>
                                  <i data-feather="eye" />
                                </a>
                              </li>
                              <li data-bs-toggle="tooltip" data-bs-placement="top" title="So sánh">
                                <a href="compare.html">
                                  <i data-feather="refresh-cw" />
                                </a>
                              </li>
                              <li data-bs-toggle="tooltip" data-bs-placement="top" title="Yêu thích">
                                <a href="wishlist.html" className="notifi-wishlist">
                                  <i data-feather="heart" />
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div className="product-detail">
                            <a href={`/${product.slug}`} onClick={(e) => {
                              e.preventDefault();
                              navigate(`/${product.slug}`);
                            }}>
                              <h6 className="name">{product.name}</h6>
                            </a>
                            <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span className="theme-color price">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceAfterDiscount)}
                              </span>
                              {discount > 0 && (
                                <del style={{ color: '#999', fontSize: '0.9em' }}>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                                </del>
                              )}
                              {product.compare_price && (
                                <del style={{ color: '#999', fontSize: '0.9em' }}>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.compare_price)}
                                </del>
                              )}
                            </h5>
                            <div className="product-rating mt-sm-2 mt-1">
                              <ul className="rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <li key={star}>
                                    <i data-feather="star" className={star <= (product.rating || 0) ? "fill" : ""} />
                                  </li>
                                ))}
                              </ul>
                              {product.status === 'active' && (
                                <h6 className="theme-color">Còn hàng</h6>
                              )}
                            </div>
                            <div className="add-to-cart-box">
                              {hasQuantity ? (
                                <div className="cart_qty qty-box">
                                  <div className="input-group">
                                    <button
                                      type="button"
                                      className="qty-left-minus"
                                      onClick={(e) => handleQuantityChange(e, product, -1)}
                                    >
                                      <i className="fa fa-minus" />
                                    </button>
                                    <input
                                      className="form-control input-number qty-input"
                                      type="text"
                                      name="quantity"
                                      value={cartItems[product._id]}
                                      readOnly
                                    />
                                    <button
                                      type="button"
                                      className="qty-right-plus"
                                      onClick={(e) => handleQuantityChange(e, product, 1)}
                                    >
                                      <i className="fa fa-plus" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  className="btn btn-add-cart addcart-button"
                                  onClick={(e) => addToCart(e, product)}
                                  type="button"
                                >
                                  Thêm
                                  <span className="add-icon">
                                    <i className="fa-solid fa-plus" />
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .product-category-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: #28a745;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
          z-index: 10;
        }
      `}</style>
    </>
  );
};

export default CategoryPage;

