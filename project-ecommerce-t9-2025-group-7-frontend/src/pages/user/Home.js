import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DOMAIN_SERVER } from "../../config/constants";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState({});
  const [categories, setCategories] = useState([]);

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
    if (parts.length === 2) return parts.pop().split(";").shift();
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

      const res = await axios.post(
        `${DOMAIN_SERVER}/api/cart/create`,
        { info_product },
        {
          withCredentials: true,
          headers: headers,
        }
      );

      if (!res.data.success) {
        console.error("Error updating cart:", res.data.message);
        loadCart();
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      loadCart();
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
    fetchProducts();
    loadCart();
    fetchCategories();
  }, [user]);

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

  useEffect(() => {
    if (loading) {
      return;
    }

    const $ = window.$;
    if (!$ || !$.fn || !$.fn.slick) {
      console.warn("jQuery slick plugin is not available.");
      return;
    }

    const sliderConfigs = [
      {
        selector: ".product-box-slider",
        settings: {
          infinite: true,
          arrows: true,
          slidesToShow: 5,
          slidesToScroll: 1,
          pauseOnHover: true,
          responsive: [
            { breakpoint: 1680, settings: { slidesToShow: 4 } },
            { breakpoint: 1400, settings: { slidesToShow: 3 } },
            { breakpoint: 1200, settings: { slidesToShow: 4 } },
            { breakpoint: 992, settings: { slidesToShow: 3 } },
            { breakpoint: 660, settings: { slidesToShow: 2 } },
          ],
        },
      },
      {
        selector: ".category-slider-2",
        settings: {
          arrows: true,
          infinite: true,
          slidesToShow: 7,
          slidesToScroll: 1,
          responsive: [
            {
              breakpoint: 1745,
              settings: {
                slidesToShow: 6,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
            {
              breakpoint: 1540,
              settings: {
                slidesToShow: 5,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
            {
              breakpoint: 910,
              settings: {
                slidesToShow: 4,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
            {
              breakpoint: 730,
              settings: {
                slidesToShow: 3,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
            {
              breakpoint: 410,
              settings: {
                slidesToShow: 2,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
          ],
        },
      },
      {
        selector: ".banner-slider",
        settings: {
          arrows: false,
          infinite: true,
          slidesToShow: 4,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 2500,
          dots: false,
          responsive: [
            { breakpoint: 1387, settings: { slidesToShow: 3 } },
            { breakpoint: 966, settings: { slidesToShow: 2 } },
            { breakpoint: 600, settings: { slidesToShow: 1, fade: true } },
          ],
        },
      },
      {
        selector: ".best-selling-slider",
        settings: {
          arrows: false,
          infinite: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          responsive: [
            {
              breakpoint: 1495,
              settings: {
                slidesToShow: 2,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 991, settings: { slidesToShow: 2 } },
            {
              breakpoint: 666,
              settings: {
                slidesToShow: 1,
                dots: true,
                autoplay: true,
                autoplaySpeed: 2500,
              },
            },
          ],
        },
      },
      {
        selector: ".slider-3-blog",
        settings: {
          arrows: true,
          infinite: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          autoplay: false,
          autoplaySpeed: 2500,
          responsive: [
            { breakpoint: 1550, settings: { slidesToShow: 2 } },
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 940, settings: { slidesToShow: 2 } },
            { breakpoint: 550, settings: { slidesToShow: 1, fade: true } },
          ],
        },
      },
    ];

    const initializedElements = [];

    sliderConfigs.forEach(({ selector, settings }) => {
      const elements = $(selector);
      if (!elements.length) {
        return;
      }

      elements.each((_, element) => {
        const instance = $(element);
        try {
          if (instance.hasClass("slick-initialized")) {
            instance.slick("unslick");
          }
          instance.slick(settings);
          initializedElements.push(instance);
        } catch (error) {
          console.warn(`Unable to initialize slider ${selector}:`, error);
        }
      });
    });

    if (window.feather) {
      window.feather.replace();
    }

    return () => {
      initializedElements.forEach((instance) => {
        try {
          if (instance && instance.hasClass("slick-initialized")) {
            instance.slick("unslick");
          }
        } catch (error) {
          console.warn("Unable to clean slick slider:", error);
        }
      });
    };
  }, [loading]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN_SERVER}/api/product`);

      if (Array.isArray(res.data)) {
        setProducts(
          res.data.filter(
            (product) => product.status === "active" && !product.deleted
          )
        );
      } else if (res.data && Array.isArray(res.data.data)) {
        setProducts(
          res.data.data.filter(
            (product) => product.status === "active" && !product.deleted
          )
        );
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.warn("Backend server is not running. Please start the server at http://localhost:5000");
        setProducts([]);
      } else {
        // For other errors, keep existing products or set empty
        setProducts([]);
      }
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
       {/* <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Danh sách sản phẩm
            </h1>
            <p className="text-gray-600">
              Khám phá các sản phẩm tuyệt vời của chúng tôi
            </p>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Không có sản phẩm
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Hiện tại chưa có sản phẩm nào
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/${product.slug}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <div className="relative aspect-w-16 aspect-h-9 bg-gray-200 overflow-hidden">
                    {product.images &&
                    Array.isArray(product.images) &&
                    product.images.length > 0 &&
                    product.images[0].url ? (
                      <>
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                          <button
                            onClick={(e) => addToCart(e, product)}
                            className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white rounded-full p-4 shadow-lg hover:bg-blue-50 hover:shadow-xl active:scale-95"
                          >
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      {product.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-blue-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </span>
                      {product.status === "active" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Còn hàng
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div> */}

       {/* Home Section Start */}
  <section className="home-section pt-2">
    <div className="container-fluid-lg">
      <div className="row g-4">
        <div className="col-xl-8 ratio_65">
          <div className="home-contain h-100">
            <div className="h-100">
              <img
                src="/assets/images/vegetable/banner/1.jpg"
                className="bg-img blur-up lazyload"
                alt=""
              />
            </div>
            <div className="home-detail p-center-left w-75">
              <div>
                <h6>
                  Ưu đãi độc quyền <span>Giảm 30%</span>
                </h6>
                <h1 className="text-uppercase">
                  Ở nhà &amp; nhận giao hàng{" "}
                  <span className="daily">Nhu cầu hàng ngày</span>
                </h1>
                <p className="w-75 d-none d-sm-block">
                  Rau củ chứa nhiều vitamin và khoáng chất tốt
                  cho sức khỏe của bạn.
                </p>
                <button
                  onClick={() => navigate('/product')}
                  className="btn btn-animation mt-xxl-4 mt-2 home-button mend-auto"
                >
                  Mua ngay <i className="fa-solid fa-right-long icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 ratio_65">
          <div className="row g-4">
            <div className="col-xl-12 col-md-6">
              <div className="home-contain">
                <img
                  src="/assets/images/vegetable/banner/2.jpg"
                  className="bg-img blur-up lazyload"
                  alt=""
                />
                <div className="home-detail p-center-left home-p-sm w-75">
                  <div>
                    <h2 className="mt-0 text-danger">
                      45% <span className="discount text-title">OFF</span>
                    </h2>
                    <h3 className="theme-color">Nut Collection</h3>
                    <p className="w-75">
                      We deliver organic vegetables &amp; fruits
                    </p>
                    <a href="shop-left-sidebar.html" className="shop-button">
                      Mua ngay <i className="fa-solid fa-right-long" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-12 col-md-6">
              <div className="home-contain">
                <img
                  src="/assets/images/vegetable/banner/3.jpg"
                  className="bg-img blur-up lazyload"
                  alt=""
                />
                <div className="home-detail p-center-left home-p-sm w-75">
                  <div>
                    <h3 className="mt-0 theme-color fw-bold">Thực phẩm lành mạnh</h3>
                    <h4 className="text-danger">Chợ hữu cơ</h4>
                    <p className="organic">
                      Bắt đầu mua sắm hàng ngày với thực phẩm hữu cơ
                    </p>
                    <a href="shop-left-sidebar.html" className="shop-button">
                      Mua ngay <i className="fa-solid fa-right-long" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* Home Section End */}
  {/* Banner Section Start */}
  <section className="banner-section ratio_60 wow fadeInUp">
    <div className="container-fluid-lg">
      <div className="banner-slider">
        <div>
          <div className="banner-contain hover-effect">
            <img
              src="/assets/images/vegetable/banner/4.jpg"
              className="bg-img blur-up lazyload"
              alt=""
            />
            <div className="banner-details">
              <div className="banner-box">
                <h6 className="text-danger">5% OFF</h6>
                <h5>Hot Deals on New Items</h5>
                <h6 className="text-content">
                  Daily Essentials Eggs &amp; Dairy
                </h6>
              </div>
              <a
                href="shop-left-sidebar.html"
                className="banner-button text-white"
              >
                Mua ngay <i className="fa-solid fa-right-long ms-2" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="banner-contain hover-effect">
            <img
              src="/assets/images/vegetable/banner/5.jpg"
              className="bg-img blur-up lazyload"
              alt=""
            />
            <div className="banner-details">
              <div className="banner-box">
                <h6 className="text-danger">5% OFF</h6>
                <h5>Buy More &amp; Save More</h5>
                <h6 className="text-content">Fresh Vegetables</h6>
              </div>
              <a
                href="shop-left-sidebar.html"
                className="banner-button text-white"
              >
                Mua ngay <i className="fa-solid fa-right-long ms-2" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="banner-contain hover-effect">
            <img
              src="/assets/images/vegetable/banner/6.jpg"
              className="bg-img blur-up lazyload"
              alt=""
            />
            <div className="banner-details">
              <div className="banner-box">
                <h6 className="text-danger">5% OFF</h6>
                <h5>Organic Meat Prepared</h5>
                <h6 className="text-content">Delivered to Your Home</h6>
              </div>
              <a
                href="shop-left-sidebar.html"
                className="banner-button text-white"
              >
                Mua ngay <i className="fa-solid fa-right-long ms-2" />
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="banner-contain hover-effect">
            <img
              src="/assets/images/vegetable/banner/7.jpg"
              className="bg-img blur-up lazyload"
              alt=""
            />
            <div className="banner-details">
              <div className="banner-box">
                <h6 className="text-danger">5% OFF</h6>
                <h5>Buy More &amp; Save More</h5>
                <h6 className="text-content">Nuts &amp; Snacks</h6>
              </div>
              <a
                href="shop-left-sidebar.html"
                className="banner-button text-white"
              >
                Mua ngay <i className="fa-solid fa-right-long ms-2" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* Banner Section End */}
  {/* Product Section Start */}
  <section className="product-section">
    <div className="container-fluid-lg">
      <div className="row g-sm-4 g-3">
        <div className="col-xxl-3 col-xl-4 d-none d-xl-block">
          <div className="p-sticky">
            <div className="category-menu">
              <h3>Danh mục</h3>
              <ul>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/vegetable.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">
                        Vegetables &amp; Fruit
                      </a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/cup.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Beverages</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/meats.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Meats &amp; Seafood</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/breakfast.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Breakfast &amp; Dairy</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/frozen.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Frozen Foods</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/biscuit.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Biscuits &amp; Snacks</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/grocery.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Grocery &amp; Staples</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/drink.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">
                        Wines &amp; Alcohol Drinks
                      </a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/milk.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Milk &amp; Dairies</a>
                    </h5>
                  </div>
                </li>
                <li className="pb-30">
                  <div className="category-list">
                    <img
                      src="/assets/svg/1/pet.svg"
                      className="blur-up lazyload"
                      alt=""
                    />
                    <h5>
                      <a href="shop-left-sidebar.html">Pet Foods</a>
                    </h5>
                  </div>
                </li>
              </ul>
              <ul className="value-list">
                <li>
                  <div className="category-list">
                    <h5 className="ms-0 text-title">
                      <a href="shop-left-sidebar.html">Giá trị trong ngày</a>
                    </h5>
                  </div>
                </li>
                <li>
                  <div className="category-list">
                    <h5 className="ms-0 text-title">
                      <a href="shop-left-sidebar.html">Top 50 ưu đãi</a>
                    </h5>
                  </div>
                </li>
                <li className="mb-0">
                  <div className="category-list">
                    <h5 className="ms-0 text-title">
                      <a href="shop-left-sidebar.html">Sản phẩm mới</a>
                    </h5>
                  </div>
                </li>
              </ul>
            </div>
            <div className="ratio_156 section-t-space">
              <div className="home-contain hover-effect">
                <img
                  src="/assets/images/vegetable/banner/8.jpg"
                  className="bg-img blur-up lazyload"
                  alt=""
                />
                <div className="home-detail p-top-left home-p-medium">
                  <div>
                    <h6 className="text-yellow home-banner">Hải sản</h6>
                    <h3 className="text-uppercase fw-normal">
                      <span className="theme-color fw-bold">Sản phẩm</span>{" "}
                      Tươi sống
                    </h3>
                    <h3 className="fw-light">mỗi giờ</h3>
                    <button
                      onClick={() => navigate('/product')}
                      className="btn btn-animation btn-md mend-auto"
                    >
                      Mua ngay <i className="fa-solid fa-arrow-right icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="ratio_medium section-t-space">
              <div className="home-contain hover-effect">
                <img
                  src="/assets/images/vegetable/banner/11.jpg"
                  className="img-fluid blur-up lazyload"
                  alt=""
                />
                <div className="home-detail p-top-left home-p-medium">
                  <div>
                    <h4 className="text-yellow text-exo home-banner">
                      Hữu cơ
                    </h4>
                    <h2 className="text-uppercase fw-normal mb-0 text-russo theme-color">
                      tươi
                    </h2>
                    <h2 className="text-uppercase fw-normal text-title">
                      Rau củ
                    </h2>
                    <p className="mb-3">Ưu đãi siêu lớn giảm đến 50%</p>
                    <button
                      onClick={() => navigate('/product')}
                      className="btn btn-animation btn-md mend-auto"
                    >
                      Mua ngay <i className="fa-solid fa-arrow-right icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="section-t-space">
              <div className="category-menu">
                <h3>Sản phẩm đang hot</h3>
                <ul className="product-list border-0 p-0 d-block">
                  <li>
                    <div className="offer-product">
                      <a
                        href="product-left-thumbnail.html"
                        className="offer-image"
                      >
                        <img
                          src="/assets/images/vegetable/product/23.png"
                          className="blur-up lazyload"
                          alt=""
                        />
                      </a>
                      <div className="offer-detail">
                        <div>
                          <a
                            href="product-left-thumbnail.html"
                            className="text-title"
                          >
                            <h6 className="name">Meatigo Premium Goat Curry</h6>
                          </a>
                          <span>450 G</span>
                          <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(70000)}</h6>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="offer-product">
                      <a
                        href="product-left-thumbnail.html"
                        className="offer-image"
                      >
                        <img
                          src="/assets/images/vegetable/product/24.png"
                          className="blur-up lazyload"
                          alt=""
                        />
                      </a>
                      <div className="offer-detail">
                        <div>
                          <a
                            href="product-left-thumbnail.html"
                            className="text-title"
                          >
                            <h6 className="name">
                              Dates Medjoul Premium Imported
                            </h6>
                          </a>
                          <span>450 G</span>
                          <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(40000)}</h6>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="offer-product">
                      <a
                        href="product-left-thumbnail.html"
                        className="offer-image"
                      >
                        <img
                          src="/assets/images/vegetable/product/25.png"
                          className="blur-up lazyload"
                          alt=""
                        />
                      </a>
                      <div className="offer-detail">
                        <div>
                          <a
                            href="product-left-thumbnail.html"
                            className="text-title"
                          >
                            <h6 className="name">Good Life Walnut Kernels</h6>
                          </a>
                          <span>200 G</span>
                          <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(52000)}</h6>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className="mb-0">
                    <div className="offer-product">
                      <a
                        href="product-left-thumbnail.html"
                        className="offer-image"
                      >
                        <img
                          src="/assets/images/vegetable/product/26.png"
                          className="blur-up lazyload"
                          alt=""
                        />
                      </a>
                      <div className="offer-detail">
                        <div>
                          <a
                            href="product-left-thumbnail.html"
                            className="text-title"
                          >
                            <h6 className="name">Apple Red Premium Imported</h6>
                          </a>
                          <span>1 KG</span>
                          <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(80000)}</h6>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="section-t-space">
              <div className="category-menu">
                <h3>Nhận xét khách hàng</h3>
                <div className="review-box">
                  <div className="review-contain">
                    <h5 className="w-75">
                      Chúng tôi quan tâm đến trải nghiệm khách hàng
                    </h5>
                    <p>
                      Chúng tôi luôn đặt khách hàng lên hàng đầu và cam kết mang đến
                      những sản phẩm chất lượng nhất với dịch vụ tốt nhất.
                    </p>
                  </div>
                  <div className="review-profile">
                    <div className="review-image">
                      <img
                        src="/assets/images/vegetable/review/1.jpg"
                        className="img-fluid blur-up lazyload"
                        alt=""
                      />
                    </div>
                    <div className="review-detail">
                      <h5>Tina Mcdonnale</h5>
                      <h6>Quản lý bán hàng</h6>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-9 col-xl-8">
          <div className="title title-flex">
            <div>
              <h2>Tiết kiệm hàng đầu hôm nay</h2>
              <span className="title-leaf">
                <svg className="icon-width">
                  <use xlinkHref="/assets/svg/leaf.svg#leaf" />
                </svg>
              </span>
              <p>
                Đừng bỏ lỡ cơ hội này với mức giảm giá đặc biệt chỉ trong tuần này.
              </p>
            </div>
            <div className="timing-box">
              <div className="timing">
                <i data-feather="clock" />
                <h6 className="name">Hết hạn sau :</h6>
                <div
                  className="time"
                  id="clockdiv-1"
                  data-hours={1}
                  data-minutes={2}
                  data-seconds={3}
                >
                  <ul>
                    <li>
                      <div className="counter">
                        <div className="days">
                          <h6 />
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="counter">
                        <div className="hours">
                          <h6 />
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="counter">
                        <div className="minutes">
                          <h6 />
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="counter">
                        <div className="seconds">
                          <h6 />
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="section-b-space">
            <div className="product-border border-row overflow-hidden">
              <div className="product-box-slider no-arrow">
                {products.length > 0 && products.slice(0, 10).reduce((acc, product, index) => {
                  if (index % 2 === 0) {
                    const slideProducts = [product, products[index + 1]].filter(Boolean);
                    acc.push(
                      <div key={`slide-${index}`}>
                        <div className="row m-0">
                          {slideProducts.map((p) => (
                            <div key={p._id} className="col-12 px-0">
                              <div className="product-box">
                                <div className="product-image">
                                  <a href={`/${p.slug}`} onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/${p.slug}`);
                                  }}>
                                    <img
                                      src={p.images && p.images.length > 0 ? p.images[0].url : "/assets/images/vegetable/product/1.png"}
                                      className="img-fluid blur-up lazyload"
                                      alt={p.name}
                                    />
                                  </a>
                                  <ul className="product-option">
                                    <li
                                      data-bs-toggle="tooltip"
                                      data-bs-placement="top"
                                      title="View"
                                    >
                                      <a
                                        href="javascript:void(0)"
                                        data-bs-toggle="modal"
                                        data-bs-target="#view"
                                      >
                                        <i data-feather="eye" />
                                      </a>
                                    </li>
                                    <li
                                      data-bs-toggle="tooltip"
                                      data-bs-placement="top"
                                      title="Compare"
                                    >
                                      <a href="compare.html">
                                        <i data-feather="refresh-cw" />
                                      </a>
                                    </li>
                                    <li
                                      data-bs-toggle="tooltip"
                                      data-bs-placement="top"
                                      title="Wishlist"
                                    >
                                      <a
                                        href="wishlist.html"
                                        className="notifi-wishlist"
                                      >
                                        <i data-feather="heart" />
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                                <div className="product-detail">
                                  <a href={`/${p.slug}`} onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/${p.slug}`);
                                  }}>
                                    <h6 className="name">{p.name}</h6>
                                  </a>
                                  <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span className="theme-color price">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((p.price || 0) - ((p.price || 0) * (p.discount || 0) / 100))}
                                    </span>
                                    {p.discount > 0 && (
                                      <del style={{ color: '#999', fontSize: '0.9em' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || 0)}
                                      </del>
                                    )}
                                    {p.compare_price && (
                                      <del style={{ color: '#999', fontSize: '0.9em' }}>
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.compare_price)}
                                      </del>
                                    )}
                                  </h5>
                                  <div className="product-rating mt-sm-2 mt-1">
                                    <ul className="rating">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <li key={star}>
                                          <i data-feather="star" className={star <= 4 ? "fill" : ""} />
                                        </li>
                                      ))}
                                    </ul>
                                    <h6 className="theme-color">Còn hàng</h6>
                                  </div>
                                  <div className="add-to-cart-box">
                                    {cartItems[p._id] && cartItems[p._id] > 0 ? (
                                      <div className="cart_qty qty-box">
                                        <div className="input-group">
                                          <button
                                            type="button"
                                            className="qty-left-minus"
                                            onClick={(e) => handleQuantityChange(e, p, -1)}
                                          >
                                            <i className="fa fa-minus" />
                                          </button>
                                          <input
                                            className="form-control input-number qty-input"
                                            type="text"
                                            name="quantity"
                                            value={cartItems[p._id]}
                                            readOnly
                                          />
                                          <button
                                            type="button"
                                            className="qty-right-plus"
                                            onClick={(e) => handleQuantityChange(e, p, 1)}
                                          >
                                            <i className="fa fa-plus" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button 
                                        className="btn btn-add-cart addcart-button"
                                        onClick={(e) => addToCart(e, p)}
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
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return acc;
                }, [])}
                {products.length === 0 && !loading && (
                  <div>
                    <div className="row m-0">
                      <div className="col-12 px-0 text-center p-4">
                        <p>Không có sản phẩm nào. Vui lòng kiểm tra kết nối với server.</p>
                        <p className="text-muted small">Đảm bảo backend server đang chạy tại http://localhost:5000</p>
                      </div>
                    </div>
                  </div>
                )}
                {products.length === 0 && loading && (
                  <div>
                    <div className="row m-0">
                      <div className="col-12 px-0 text-center p-4">
                        <p>Đang tải sản phẩm...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="title">
            <h2>Duyệt theo danh mục</h2>
            <span className="title-leaf">
              <svg className="icon-width">
                <use xlinkHref="/assets/svg/leaf.svg#leaf" />
              </svg>
            </span>
            <p>Danh mục hàng đầu trong tuần</p>
          </div>
          <div className="category-slider-2 product-wrapper no-arrow">
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/vegetable.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Vegetables &amp; Fruit</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/fruit.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Fruit &amp; Vegetable</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/milk.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Milk &amp; Dairy</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/meat.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Meat &amp; Fish</h5>
                </div>
              </a>
            </div>
          </div>
          <div className="title">
            <h2>Duyệt theo danh mục</h2>
            <span className="title-leaf">
              <svg className="icon-width">
                <use xlinkHref="/assets/svg/leaf.svg#leaf" />
              </svg>
            </span>
            <p>Danh mục hàng đầu trong tuần</p>
          </div>
          <div className="category-slider-2 product-wrapper no-arrow">
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/cup.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Beverages</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/meats.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Meats &amp; Seafood</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/breakfast.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Breakfast</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/frozen.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Frozen Foods</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/milk.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Milk &amp; Dairies</h5>
                </div>
              </a>
            </div>
            <div>
              <a
                href="shop-left-sidebar.html"
                className="category-box category-dark"
              >
                <div>
                  <img
                    src="/assets/svg/1/pet.svg"
                    className="blur-up lazyload"
                    alt=""
                  />
                  <h5>Pet Food</h5>
                </div>
              </a>
            </div>
          </div>
          <div className="section-t-space section-b-space">
            <div className="row g-md-4 g-3">
              <div className="col-md-6">
                <div className="banner-contain hover-effect">
                  <img
                    src="/assets/images/vegetable/banner/9.jpg"
                    className="bg-img blur-up lazyload"
                    alt=""
                  />
                  <div className="banner-details p-center-left p-4">
                    <div>
                      <h3 className="text-exo">Ưu đãi 50%</h3>
                      <h4 className="text-russo fw-normal theme-color mb-2">
                        Nấm ngon
                      </h4>
                      <button
                        onClick={() => navigate('/product')}
                        className="btn btn-animation btn-sm mend-auto"
                      >
                        Mua ngay <i className="fa-solid fa-arrow-right icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="banner-contain hover-effect">
                  <img
                    src="/assets/images/vegetable/banner/10.jpg"
                    className="bg-img blur-up lazyload"
                    alt=""
                  />
                  <div className="banner-details p-center-left p-4">
                    <div>
                      <h3 className="text-exo">Ưu đãi 50%</h3>
                      <h4 className="text-russo fw-normal theme-color mb-2">
                        THỊT TƯƠI
                      </h4>
                      <button
                        onClick={() => navigate('/product')}
                        className="btn btn-animation btn-sm mend-auto"
                      >
                        Mua ngay <i className="fa-solid fa-arrow-right icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="title d-block">
            <h2>Tủ thực phẩm</h2>
            <span className="title-leaf">
              <svg className="icon-width">
                <use xlinkHref="/assets/svg/leaf.svg#leaf" />
              </svg>
            </span>
            <p>Trợ lý ảo thu thập sản phẩm từ danh sách của bạn</p>
          </div>
          <div className="product-border overflow-hidden wow fadeInUp">
            <div className="product-box-slider no-arrow">
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/1.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Chocolate Powder</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/2.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Sandwich Cookies</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/3.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Butter Croissant</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/4.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Dark Chocolate</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/5.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Mix-sweet-food</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="row m-0">
                  <div className="col-12 px-0">
                    <div className="product-box">
                      <div className="product-image">
                        <a href="product-left-thumbnail.html">
                          <img
                            src="/assets/images/vegetable/product/4.png"
                            className="img-fluid blur-up lazyload"
                            alt=""
                          />
                        </a>
                        <ul className="product-option">
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View"
                          >
                            <a
                              href="javascript:void(0)"
                              data-bs-toggle="modal"
                              data-bs-target="#view"
                            >
                              <i data-feather="eye" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Compare"
                          >
                            <a href="compare.html">
                              <i data-feather="refresh-cw" />
                            </a>
                          </li>
                          <li
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Wishlist"
                          >
                            <a href="wishlist.html" className="notifi-wishlist">
                              <i data-feather="heart" />
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div className="product-detail">
                        <a href="product-left-thumbnail.html">
                          <h6 className="name h-100">Dark Chocolate</h6>
                        </a>
                        <h5 className="sold text-content" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="theme-color price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(26690)}</span>
                          <del style={{ color: '#999', fontSize: '0.9em' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(28560)}</del>
                        </h5>
                        <div className="product-rating mt-sm-2 mt-1">
                          <ul className="rating">
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" className="fill" />
                            </li>
                            <li>
                              <i data-feather="star" />
                            </li>
                          </ul>
                          <h6 className="theme-color">In Stock</h6>
                        </div>
                        <div className="add-to-cart-box">
                          <button className="btn btn-add-cart addcart-button">
                            Add
                            <span className="add-icon">
                              <i className="fa-solid fa-plus" />
                            </span>
                          </button>
                          <div className="cart_qty qty-box">
                            <div className="input-group">
                              <button
                                type="button"
                                className="qty-left-minus"
                                data-type="minus"
                                data-field=""
                              >
                                <i className="fa fa-minus" />
                              </button>
                              <input
                                className="form-control input-number qty-input"
                                type="text"
                                name="quantity"
                                defaultValue={0}
                              />
                              <button
                                type="button"
                                className="qty-right-plus"
                                data-type="plus"
                                data-field=""
                              >
                                <i className="fa fa-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="section-t-space">
            <div className="banner-contain">
              <img
                src="/assets/images/vegetable/banner/15.jpg"
                className="bg-img blur-up lazyload"
                alt=""
              />
              <div className="banner-details p-center p-4 text-white text-center">
                <div>
                  <h3 className="lh-base fw-bold offer-text">
                    Nhận $3 hoàn tiền! Đơn hàng tối thiểu $30
                  </h3>
                  <h6 className="coupon-code">Sử dụng mã : GROCERY1920</h6>
                </div>
              </div>
            </div>
          </div>
          <div className="section-t-space section-b-space">
            <div className="row g-md-4 g-3">
              <div className="col-xxl-8 col-xl-12 col-md-7">
                <div className="banner-contain hover-effect">
                  <img
                    src="/assets/images/vegetable/banner/12.jpg"
                    className="bg-img blur-up lazyload"
                    alt=""
                  />
                  <div className="banner-details p-center-left p-4">
                    <div>
                      <h2 className="text-kaushan fw-normal theme-color">
                        Sẵn sàng để
                      </h2>
                      <h3 className="mt-2 mb-3">ĐÓN NHẬN NGÀY MỚI!</h3>
                      <p className="text-content banner-text">
                        Chúng tôi cam kết mang đến những sản phẩm tươi ngon nhất
                        và dịch vụ tốt nhất cho bạn.
                      </p>
                      <button
                        onClick={() => navigate('/product')}
                        className="btn btn-animation btn-sm mend-auto"
                      >
                        Mua ngay <i className="fa-solid fa-arrow-right icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xxl-4 col-xl-12 col-md-5">
                <a
                  href="shop-left-sidebar.html"
                  className="banner-contain hover-effect h-100"
                >
                  <img
                    src="/assets/images/vegetable/banner/13.jpg"
                    className="bg-img blur-up lazyload"
                    alt=""
                  />
                  <div className="banner-details p-center-left p-4 h-100">
                    <div>
                      <h2 className="text-kaushan fw-normal text-danger">
                        20% Off
                      </h2>
                      <h3 className="mt-2 mb-2 theme-color">SUMMRY</h3>
                      <h3 className="fw-normal product-name text-title">
                        Product
                      </h3>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="title d-block">
            <div>
              <h2>Sản phẩm bán chạy nhất</h2>
              <span className="title-leaf">
                <svg className="icon-width">
                  <use xlinkHref="/assets/svg/leaf.svg#leaf" />
                </svg>
              </span>
              <p>Trợ lý ảo thu thập sản phẩm từ danh sách của bạn</p>
            </div>
          </div>
          <div className="best-selling-slider product-wrapper wow fadeInUp">
            <div>
              <ul className="product-list">
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/11.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Tuffets Whole Wheat Bread</h6>
                        </a>
                        <span>500 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/12.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Potato</h6>
                        </a>
                        <span>500 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/13.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Green Chilli</h6>
                        </a>
                        <span>200 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/14.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Muffets Burger Bun</h6>
                        </a>
                        <span>150 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <ul className="product-list">
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/15.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Tuffets Britannia Cheezza</h6>
                        </a>
                        <span>500 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/16.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Long Life Toned Milk</h6>
                        </a>
                        <span>1 L</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/17.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Organic Tomato</h6>
                        </a>
                        <span>1 KG</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/18.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Organic Jam</h6>
                        </a>
                        <span>150 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <ul className="product-list">
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/19.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">
                            Good Life Refined Sunflower Oil
                          </h6>
                        </a>
                        <span>1 L</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/20.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Good Life Raw Peanuts</h6>
                        </a>
                        <span>500 G</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/21.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">TufBest Farms Mong Dal</h6>
                        </a>
                        <span>1 KG</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="offer-product">
                    <a
                      href="product-left-thumbnail.html"
                      className="offer-image"
                    >
                      <img
                        src="/assets/images/vegetable/product/22.png"
                        className="blur-up lazyload"
                        alt=""
                      />
                    </a>
                    <div className="offer-detail">
                      <div>
                        <a
                          href="product-left-thumbnail.html"
                          className="text-title"
                        >
                          <h6 className="name">Frooti Mango Drink</h6>
                        </a>
                        <span>160 ML</span>
                        <h6 className="price theme-color">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(10000)}</h6>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="section-t-space">
            <div className="banner-contain hover-effect">
              <img
                src="/assets/images/vegetable/banner/14.jpg"
                className="bg-img blur-up lazyload"
                alt=""
              />
              <div className="banner-details p-center banner-b-space w-100 text-center">
                <div>
                  <h6 className="ls-expanded theme-color mb-sm-3 mb-1">
                    MÙA HÈ
                  </h6>
                  <h2 className="banner-title">RAU CỦ</h2>
                  <h5 className="lh-sm mx-auto mt-1 text-content">
                    Tiết kiệm lên đến 5%
                  </h5>
                  <button
                    onClick={() => navigate('/product')}
                    className="btn btn-animation btn-sm mx-auto mt-sm-3 mt-2"
                  >
                    Mua ngay <i className="fa-solid fa-arrow-right icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="title section-t-space">
            <h2>Blog nổi bật</h2>
            <span className="title-leaf">
              <svg className="icon-width">
                <use xlinkHref="/assets/svg/leaf.svg#leaf" />
              </svg>
            </span>
            <p>Trợ lý ảo thu thập sản phẩm từ danh sách của bạn</p>
          </div>
          <div className="slider-3-blog ratio_65 no-arrow product-wrapper">
            <div>
              <div className="blog-box">
                <div className="blog-box-image">
                  <a href="blog-detail.html" className="blog-image">
                    <img
                      src="/assets/images/vegetable/blog/1.jpg"
                      className="bg-img blur-up lazyload"
                      alt=""
                    />
                  </a>
                </div>
                <a href="blog-detail.html" className="blog-detail">
                  <h6>20 March, 2022</h6>
                  <h5>Fresh Vegetable Online</h5>
                </a>
              </div>
            </div>
            <div>
              <div className="blog-box">
                <div className="blog-box-image">
                  <a href="blog-detail.html" className="blog-image">
                    <img
                      src="/assets/images/vegetable/blog/2.jpg"
                      className="bg-img blur-up lazyload"
                      alt=""
                    />
                  </a>
                </div>
                <a href="blog-detail.html" className="blog-detail">
                  <h6>10 April, 2022</h6>
                  <h5>Fresh Combo Fruit</h5>
                </a>
              </div>
            </div>
            <div>
              <div className="blog-box">
                <div className="blog-box-image">
                  <a href="blog-detail.html" className="blog-image">
                    <img
                      src="/assets/images/vegetable/blog/3.jpg"
                      className="bg-img blur-up lazyload"
                      alt=""
                    />
                  </a>
                </div>
                <a href="blog-detail.html" className="blog-detail">
                  <h6>10 April, 2022</h6>
                  <h5>Nuts to Eat for Better Health</h5>
                </a>
              </div>
            </div>
            <div>
              <div className="blog-box">
                <div className="blog-box-image">
                  <a href="blog-detail.html" className="blog-image">
                    <img
                      src="/assets/images/vegetable/blog/1.jpg"
                      className="bg-img blur-up lazyload"
                      alt=""
                    />
                  </a>
                </div>
                <a href="blog-detail.html" className="blog-detail">
                  <h6>20 March, 2022</h6>
                  <h5>Fresh Vegetable Online</h5>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* Product Section End */}
  {/* Newsletter Section Start */}
  <section className="newsletter-section section-b-space">
    <div className="container-fluid-lg">
      <div className="newsletter-box newsletter-box-2">
        <div className="newsletter-contain py-5">
          <div className="container-fluid">
            <div className="row">
              <div className="col-xxl-4 col-lg-5 col-md-7 col-sm-9 offset-xxl-2 offset-md-1">
                <div className="newsletter-detail">
                  <h2>Tham gia bản tin của chúng tôi và nhận...</h2>
                  <h5>Giảm $20 cho đơn hàng đầu tiên</h5>
                  <div className="input-box">
                    <input
                      type="email"
                      className="form-control"
                      id="exampleFormControlInput1"
                      placeholder="Nhập email của bạn"
                    />
                    <i className="fa-solid fa-envelope arrow" />
                    <button className="sub-btn  btn-animation">
                      <span className="d-sm-block d-none">Đăng ký</span>
                      <i className="fa-solid fa-arrow-right icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* Newsletter Section End */}
    </>
  );
};

export default Home;
