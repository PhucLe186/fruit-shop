import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { DOMAIN_SERVER } from "../config/constants";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    loadCart();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadCart();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchProducts = async (query) => {
    if (!query || query.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const res = await axios.get(`${DOMAIN_SERVER}/api/product/search`, {
        params: { q: query.trim() },
      });

      if (res.data.success) {
        setSearchResults(res.data.data || []);
        setShowSearchDropdown(true);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/product?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleProductClick = (product) => {
    setShowSearchDropdown(false);
    setSearchQuery("");
    navigate(`/${product.slug}`);
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(amount || 0));
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${DOMAIN_SERVER}/api/category`);
      if (res.data.success && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

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

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
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
      setCartItems([]);
    }
  };

  const loadCart = async () => {
    if (!user) {
      await loadCartFromCookie();
    } else {
      await loadCartFromServer();
    }
  };

  const removeItemLocal = (productId) => {
    const updatedCart = cartItems.filter((item) => item._id !== productId);
    setCookie("cart", encodeURIComponent(JSON.stringify(updatedCart)));
    setCartItems(updatedCart);
  };

  const removeItemServer = async (productId) => {
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
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const removeItem = (productId) => {
    if (!user) {
      removeItemLocal(productId);
    } else {
      removeItemServer(productId);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      const discount = item.discount || 0;
      const priceAfterDiscount = price - (price * discount) / 100;
      return total + priceAfterDiscount * (item.quantity || 1);
    }, 0);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      <header className="pb-md-4 pb-0">
        <div className="header-top">
          <div className="container-fluid-lg">
            <div className="row">
              <div className="col-xxl-3 d-xxl-block d-none">
                <div className="top-left-header">
                  <i className="iconly-Location icli text-white" />
                  <span className="text-white">
                    1418 Riverwood Drive, CA 96052, US
                  </span>
                </div>
              </div>
              <div className="col-xxl-6 col-lg-9 d-lg-block d-none">
                <div className="header-offer">
                  <div className="notification-slider">
                    <div>
                      <div className="timer-notification">
                        <h6>
                          <strong className="me-1">Chào mừng đến với Fastkart!</strong>
                          Ưu đãi mới/quà tặng mỗi ngày vào cuối tuần.
                          <strong className="ms-1">
                            Mã giảm giá mới: Fast024
                          </strong>
                        </h6>
                      </div>
                    </div>
                    <div>
                      <div className="timer-notification">
                        <h6>
                          Những gì bạn yêu thích đang được giảm giá!
                          <a
                            href="shop-left-sidebar.html"
                            className="text-white"
                          >
                            Mua ngay !
                          </a>
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <ul className="about-list right-nav-about">
                  <li className="right-nav-list">
                    <div className="dropdown theme-form-select">
                      <button
                        className="btn dropdown-toggle"
                        type="button"
                        id="select-language"
                        data-bs-toggle="dropdown"
                      >
                        <img
                          src="/assets/images/country/united-states.png"
                          className="img-fluid blur-up lazyload"
                          alt=""
                        />
                        <span>Tiếng Việt</span>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0)"
                            id="english"
                          >
                            <img
                              src="/assets/images/country/united-kingdom.png"
                              className="img-fluid blur-up lazyload"
                              alt=""
                            />
                            <span>Tiếng Việt</span>
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0)"
                            id="france"
                          >
                            <img
                              src="/assets/images/country/germany.png"
                              className="img-fluid blur-up lazyload"
                              alt=""
                            />
                            <span>Germany</span>
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            href="javascript:void(0)"
                            id="chinese"
                          >
                            <img
                              src="/assets/images/country/turkish.png"
                              className="img-fluid blur-up lazyload"
                              alt=""
                            />
                            <span>Turki</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                  <li className="right-nav-list">
                    <div className="dropdown theme-form-select">
                      <button
                        className="btn dropdown-toggle"
                        type="button"
                        id="select-dollar"
                        data-bs-toggle="dropdown"
                      >
                        <span>USD</span>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end sm-dropdown-menu">
                        <li>
                          <a
                            className="dropdown-item"
                            id="aud"
                            href="javascript:void(0)"
                          >
                            AUD
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            id="eur"
                            href="javascript:void(0)"
                          >
                            EUR
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item"
                            id="cny"
                            href="javascript:void(0)"
                          >
                            CNY
                          </a>
                        </li>
                      </ul>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="top-nav top-header sticky-header">
          <div className="container-fluid-lg">
            <div className="row">
              <div className="col-12">
                <div className="navbar-top">
                  <button
                    className="navbar-toggler d-xl-none d-inline navbar-menu-button"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#primaryMenu"
                  >
                    <span className="navbar-toggler-icon">
                      <i className="fa-solid fa-bars" />
                    </span>
                  </button>
                  <a href="index.html" className="web-logo nav-logo">
                    <img
                      src="/assets/images/logo/1.png"
                      className="img-fluid blur-up lazyload"
                      alt=""
                    />
                  </a>
                  <div className="middle-box">
                    <div className="location-box">
                      <button
                        className="btn location-button"
                        data-bs-toggle="modal"
                        data-bs-target="#locationModal"
                      >
                        <span className="location-arrow">
                          <i data-feather="map-pin" />
                        </span>
                        <span className="locat-name">Vị trí của bạn</span>
                        <i className="fa-solid fa-angle-down" />
                      </button>
                    </div>
                    <div className="search-box" style={{ position: "relative" }}>
                      <form onSubmit={handleSearchSubmit}>
                        <div className="input-group">
                          <input
                            ref={searchInputRef}
                            type="search"
                            className="form-control"
                            placeholder="Tôi đang tìm kiếm..."
                            value={searchQuery}
                            onChange={handleSearchInputChange}
                            onFocus={() => {
                              if (searchResults.length > 0) {
                                setShowSearchDropdown(true);
                              }
                            }}
                          />
                          <button
                            className="btn"
                            type="submit"
                            id="button-addon2"
                          >
                            <i data-feather="search" />
                          </button>
                        </div>
                      </form>
                      {showSearchDropdown && (
                        <div
                          ref={searchDropdownRef}
                          className="search-dropdown"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #dee2e6",
                            borderRadius: "0.375rem",
                            boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                            zIndex: 1000,
                            maxHeight: "400px",
                            overflowY: "auto",
                            marginTop: "4px",
                          }}
                        >
                          {isSearching ? (
                            <div className="p-3 text-center">
                              <div className="spinner-border spinner-border-sm text-primary" role="status">
                                <span className="visually-hidden">Đang tìm kiếm...</span>
                              </div>
                              <span className="ms-2">Đang tìm kiếm...</span>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <>
                              <div className="p-2 border-bottom bg-light">
                                <small className="text-muted">
                                  Tìm thấy {searchResults.length} kết quả
                                </small>
                              </div>
                              {searchResults.slice(0, 5).map((product) => {
                                const price = product.price || 0;
                                const discount = product.discount || 0;
                                const priceAfterDiscount = price - (price * discount) / 100;
                                return (
                                  <div
                                    key={product._id}
                                    className="search-result-item p-3 border-bottom"
                                    style={{
                                      cursor: "pointer",
                                      transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "white";
                                    }}
                                    onClick={() => handleProductClick(product)}
                                  >
                                    <div className="d-flex align-items-center">
                                      {product.images && product.images.length > 0 && (
                                        <img
                                          src={product.images[0].url}
                                          alt={product.name}
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            objectFit: "cover",
                                            borderRadius: "4px",
                                            marginRight: "12px",
                                          }}
                                          onError={(e) => {
                                            e.target.src = "/assets/images/vegetable/product/1.png";
                                          }}
                                        />
                                      )}
                                      <div className="flex-grow-1">
                                        <h6 className="mb-1" style={{ fontSize: "14px", fontWeight: "500" }}>
                                          {product.name}
                                        </h6>
                                        {product.category && (
                                          <small className="text-muted d-block mb-1">
                                            {product.category.name}
                                          </small>
                                        )}
                                        <div className="d-flex align-items-center">
                                          {discount > 0 ? (
                                            <>
                                              <span className="text-danger fw-bold me-2">
                                                {formatVND(priceAfterDiscount)} VND
                                              </span>
                                              <span className="text-muted text-decoration-line-through" style={{ fontSize: "12px" }}>
                                                {formatVND(price)} VND
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-primary fw-bold">
                                              {formatVND(price)} VND
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {searchResults.length > 5 && (
                                <div
                                  className="p-2 text-center border-top bg-light"
                                  style={{ cursor: "pointer" }}
                                  onClick={handleSearchSubmit}
                                >
                                  <small className="text-primary">
                                    Xem tất cả {searchResults.length} kết quả
                                  </small>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-3 text-center text-muted">
                              Không tìm thấy sản phẩm nào
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rightside-box">
                    <div className="search-full">
                      <div className="input-group">
                        <span className="input-group-text">
                          <i data-feather="search" className="font-light" />
                        </span>
                        <input
                          type="text"
                          className="form-control search-type"
                          placeholder="Tìm kiếm ở đây.."
                        />
                        <span className="input-group-text close-search">
                          <i data-feather="x" className="font-light" />
                        </span>
                      </div>
                    </div>
                    <ul className="right-side-menu">
                      <li className="right-side">
                        <div className="delivery-login-box">
                          <div className="delivery-icon">
                            <div className="search-box">
                              <i data-feather="search" />
                            </div>
                          </div>
                        </div>
                      </li>
                      <li className="right-side">
                        <a
                          href="contact-us.html"
                          className="delivery-login-box"
                        >
                          <div className="delivery-icon">
                            <i data-feather="phone-call" />
                          </div>
                          <div className="delivery-detail">
                            <h6>Giao hàng 24/7</h6>
                            <h5>+91 888 104 2340</h5>
                          </div>
                        </a>
                      </li>
                      <li className="right-side">
                        <a
                          href="wishlist.html"
                          className="btn p-0 position-relative header-wishlist"
                        >
                          <i data-feather="heart" />
                        </a>
                      </li>
                      <li className="right-side">
                        <div className="onhover-dropdown header-badge">
                          <button
                            type="button"
                            className="btn p-0 position-relative header-wishlist"
                            onClick={() => navigate("/cart")}
                          >
                            <i data-feather="shopping-cart" />
                            {cartCount > 0 && (
                              <span className="position-absolute top-0 start-100 translate-middle badge">
                                {cartCount}
                                <span className="visually-hidden">
                                  tin nhắn chưa đọc
                                </span>
                              </span>
                            )}
                          </button>
                          <div className="onhover-div">
                            {cartItems.length > 0 ? (
                              <>
                                <ul className="cart-list">
                                  {cartItems.map((item) => {
                                    const price = item.price || 0;
                                    const discount = item.discount || 0;
                                    const priceAfterDiscount = price - (price * discount) / 100;
                                    return (
                                      <li key={item._id} className="product-box-contain">
                                        <div className="drop-cart" style={{ position: 'relative' }}>
                                          <button
                                            className="close-button close_button"
                                            style={{
                                              position: 'absolute',
                                              top: '0',
                                              right: '0',
                                              zIndex: '10',
                                              background: 'transparent',
                                              border: 'none',
                                              padding: '5px',
                                              cursor: 'pointer',
                                              fontSize: '16px',
                                              color: '#666'
                                            }}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              removeItem(item._id);
                                            }}
                                          >
                                            <i className="fa-solid fa-xmark" />
                                          </button>
                                          <Link
                                            to={`/product/${item.slug}`}
                                            className="drop-image"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            <img
                                              src={item.image || "/assets/images/vegetable/product/1.png"}
                                              className="blur-up lazyload"
                                              alt={item.name}
                                              onError={(e) => {
                                                e.target.src = "/assets/images/vegetable/product/1.png";
                                              }}
                                            />
                                          </Link>
                                          <div className="drop-contain">
                                            <Link
                                              to={`/product/${item.slug}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                              }}
                                            >
                                              <h5>{item.name}</h5>
                                            </Link>
                                            <h6>
                                              <span>{item.quantity || 1} x</span> {formatVND(priceAfterDiscount)} VND
                                            </h6>
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                <div className="price-box">
                                  <h5>Tổng cộng :</h5>
                                  <h4 className="theme-color fw-bold">{formatVND(calculateTotal())} VND</h4>
                                </div>
                                <div className="button-group">
                                  <Link
                                    to="/cart"
                                    className="btn btn-sm cart-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    Xem giỏ hàng
                                  </Link>
                                  <Link
                                    to="/checkout"
                                    className="btn btn-sm cart-button theme-bg-color text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    Thanh toán
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <div className="empty-cart">
                                <p>Giỏ hàng của bạn đang trống</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                      <li className="right-side onhover-dropdown">
                        {user ? (
                          <>
                            <div className="delivery-login-box">
                              <div className="delivery-icon">
                                <i data-feather="user" />
                              </div>
                              <div className="delivery-detail">
                                <h6>Xin chào,</h6>
                                <h5>{user.fullname || user.username}</h5>
                              </div>
                            </div>
                            <div className="onhover-div onhover-div-login">
                              <ul className="user-box-name">
                                <li className="product-box-contain">
                                  <button 
                                    type="button"
                                    className="btn-link"
                                    style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', textDecoration: 'none' }}
                                    onClick={logout}
                                  >
                                    Đăng xuất
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="delivery-login-box">
                              <div className="delivery-icon">
                                <i data-feather="user" />
                              </div>
                              <div className="delivery-detail">
                                <h6>Xin chào,</h6>
                                <h5>Tài khoản của tôi</h5>
                              </div>
                            </div>
                            <div className="onhover-div onhover-div-login">
                              <ul className="user-box-name">
                                <li className="product-box-contain">
                                  <i />
                                  <Link to="/login">Đăng nhập</Link>
                                </li>
                                <li className="product-box-contain">
                                  <Link to="/sign-up">Đăng ký</Link>
                                </li>
                                <li className="product-box-contain">
                                  <a href="forgot.html">Quên mật khẩu</a>
                                </li>
                              </ul>
                            </div>
                          </>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="header-nav">
                <div className="header-nav-left">
                  <button className="dropdown-category">
                    <i data-feather="align-left" />
                    <span>Tất cả danh mục</span>
                  </button>
                  <div className="category-dropdown">
                    <div className="category-title">
                      <h5>Danh mục</h5>
                      <button
                        type="button"
                        className="btn p-0 close-button text-content"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                    <ul className="category-list">
                      {categories.map((category) => (
                        <li key={category._id} className="onhover-category-list">
                          <a
                            href="javascript:void(0)"
                            className="category-name"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/category/${category.slug}`);
                            }}
                          >
                            <img
                              src="/assets/svg/1/vegetable.svg"
                              alt={category.name}
                            />
                            <h6>{category.name}</h6>
                            <i className="fa-solid fa-angle-right" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="header-nav-middle">
                  <div className="main-nav navbar navbar-expand-xl navbar-light navbar-sticky">
                    <div
                      className="offcanvas offcanvas-collapse order-xl-2"
                      id="primaryMenu"
                    >
                      <div className="offcanvas-header navbar-shadow">
                        <h5>Menu</h5>
                        <button
                          className="btn-close lead"
                          type="button"
                          data-bs-dismiss="offcanvas"
                        />
                      </div>
                      <div className="offcanvas-body">
                        <ul className="navbar-nav">
                          <li className="nav-item">
                            <a
                              className="nav-link"
                              href="/"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/");
                              }}
                            >
                              Trang chủ
                            </a>
                          </li>
                          <li className="nav-item">
                            <a
                              className="nav-link"
                              href="/product"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate("/product");
                              }}
                            >
                              Sản phẩm
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="header-nav-right">
                  <button
                    className="btn deal-button"
                    data-bs-toggle="modal"
                    data-bs-target="#deal-box"
                  >
                    <i data-feather="zap" />
                    <span>Ưu đãi hôm nay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
