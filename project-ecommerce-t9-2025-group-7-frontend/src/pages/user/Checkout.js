import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import JustValidate from 'just-validate';
import { DOMAIN_SERVER } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [promotion, setPromotion] = useState(null);
  const [checkingPromotion, setCheckingPromotion] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [allPromotions, setAllPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'cod'
  });
  const formRef = useRef(null);
  const validatorRef = useRef(null);

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

  const loadCartFromCookie = async () => {
    try {
      const cartCookie = getCookie('cart');
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
            productData.status === 'active' &&
            !productData.deleted
          ) {
            updatedCart.push({
              _id: productData._id,
              slug: productData.slug,
              name: productData.name,
              price: productData.price,
              compare_price: productData.compare_price || null,
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
    if (parts.length === 2) return parts.pop().split(';').shift();
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
              compare_price: product.compare_price || null,
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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullname || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const promotionCookie = getCookie('promotion');
    if (promotionCookie) {
      try {
        const promotionData = JSON.parse(decodeURIComponent(promotionCookie));
        setPromotion(promotionData);
        setPromotionCode(promotionData.code || '');
      } catch (error) {
        console.error('Error parsing promotion cookie:', error);
      }
    }
  }, []);

  const fetchAllPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const res = await axios.get(`${DOMAIN_SERVER}/api/promotion`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setAllPromotions(res.data.data);
      } else {
        setAllPromotions([]);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setAllPromotions([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  const handleOpenPromotionModal = () => {
    setShowPromotionModal(true);
    fetchAllPromotions();
  };

  const handleSelectPromotion = (promo) => {
    setPromotionCode(promo.code);
    setShowPromotionModal(false);
    handleCheckPromotionWithCode(promo.code);
  };

  const handleCheckPromotionWithCode = async (code) => {
    if (!code || !code.trim()) {
      return;
    }

    setCheckingPromotion(true);
    try {
      const subtotal = calculateSubtotal();
      const res = await axios.post(`${DOMAIN_SERVER}/api/promotion/check`, {
        code: code.trim().toUpperCase(),
        orderValue: subtotal
      });

      if (res.data.success && res.data.data) {
        const promotionData = res.data.data;
        setPromotion(promotionData);
        setCookie('promotion', JSON.stringify(promotionData), 1);
        
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: res.data.message || 'Áp dụng mã khuyến mãi thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        setPromotion(null);
        setCookie('promotion', '', -1);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Mã khuyến mãi không hợp lệ',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      setPromotion(null);
      setCookie('promotion', '', -1);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể kiểm tra mã khuyến mãi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setCheckingPromotion(false);
    }
  };

  const handleCheckPromotion = async () => {
    if (!promotionCode.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Cảnh báo!',
        text: 'Vui lòng nhập mã khuyến mãi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    setCheckingPromotion(true);
    try {
      const subtotal = calculateSubtotal();
      const res = await axios.post(`${DOMAIN_SERVER}/api/promotion/check`, {
        code: promotionCode.trim().toUpperCase(),
        orderValue: subtotal
      });

      if (res.data.success && res.data.data) {
        const promotionData = res.data.data;
        setPromotion(promotionData);
        setCookie('promotion', JSON.stringify(promotionData), 1);
        
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: res.data.message || 'Áp dụng mã khuyến mãi thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
      } else {
        setPromotion(null);
        setCookie('promotion', '', -1);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Mã khuyến mãi không hợp lệ',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      setPromotion(null);
      setCookie('promotion', '', -1);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể kiểm tra mã khuyến mãi',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setCheckingPromotion(false);
    }
  };

  const handleRemovePromotion = () => {
    setPromotion(null);
    setPromotionCode('');
    setCookie('promotion', '', -1);
  };

  useEffect(() => {
    if (formRef.current && !loading) {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }

      validatorRef.current = new JustValidate(formRef.current, {
        errorFieldCssClass: 'is-invalid',
        errorLabelCssClass: 'invalid-feedback',
        successFieldCssClass: 'is-valid',
        focusInvalidField: true,
        lockForm: true,
      });

      validatorRef.current
        .addField('#fullName', [
          {
            rule: 'required',
            errorMessage: 'Họ tên không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Họ tên phải có ít nhất 3 ký tự'
          }
        ])
        .addField('#email', [
          {
            rule: 'required',
            errorMessage: 'Email không được để trống'
          },
          {
            rule: 'email',
            errorMessage: 'Email không hợp lệ'
          }
        ])
        .addField('#phone', [
          {
            rule: 'required',
            errorMessage: 'Số điện thoại không được để trống'
          },
          {
            rule: 'custom',
            validator: (value) => {
              const phoneRegex = /^[0-9]{10,11}$/;
              return phoneRegex.test(value.replace(/\s/g, ''));
            },
            errorMessage: 'Số điện thoại không hợp lệ'
          }
        ])
        .addField('#address', [
          {
            rule: 'required',
            errorMessage: 'Địa chỉ không được để trống'
          },
          {
            rule: 'minLength',
            value: 10,
            errorMessage: 'Địa chỉ phải có ít nhất 10 ký tự'
          }
        ]);
    }

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }
    };
  }, [loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  };

  const calculatePromotionDiscount = () => {
    if (!promotion) return 0;
    
    const subtotal = calculateSubtotal();
    
    if (subtotal < promotion.minOrderValue) {
      return 0;
    }
    
    if (promotion.discountType === 'percent') {
      const discount = (subtotal * promotion.discountValue) / 100;
      return Math.round(discount);
    } else {
      return Math.round(promotion.discountValue);
    }
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculatePromotionDiscount();
    return Math.max(0, subtotal - discount);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.quantity || 1);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatorRef.current) return;
    
    const isValid = await validatorRef.current.validate();
    if (!isValid) return;

    if (cartItems.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Giỏ hàng trống!',
        text: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      navigate('/');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const infoProduct = cartItems.map(item => {
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const comparePrice = item.compare_price || null;
        let discount = 0;
        if (comparePrice && comparePrice > price) {
          discount = Math.round(((comparePrice - price) / comparePrice) * 100 * 100) / 100;
        }
        const total = Math.round(price * quantity * 100) / 100;
        
        return {
          product: item._id,
          quantity: quantity,
          price: price,
          discount: discount,
          total: total
        };
      });

      const subtotal = calculateSubtotal();
      const promotionDiscount = calculatePromotionDiscount();
      const orderTotal = Math.round((subtotal - promotionDiscount) * 100) / 100;

      const orderData = {
        info_product: infoProduct,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        name: formData.fullName,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'unpaid',
        total: orderTotal,
        discount: Math.round(promotionDiscount * 100) / 100,
        status: 'pending'
      };

      if (promotion && promotionDiscount > 0) {
        orderData.promotion = {
          id: promotion._id,
          code: promotion.code,
          name: promotion.name,
          discount: Math.round(promotionDiscount * 100) / 100
        };
      }

      if (user && user.id) {
        orderData.customer = user.id;
      }
        
      const res = await axios.post(`${DOMAIN_SERVER}/api/order/create`, orderData, {
        withCredentials: true
      });

      if (res.data.success === true) {
        const orderId = res.data.orderId

        if (formData.paymentMethod === 'bank') {
          try {
            const token = getToken();
            const headers = {};
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }

            const paymentRes = await axios.post(
              `${DOMAIN_SERVER}/api/payment/vnpay/create-payment-url`,
              {
                orderId: orderId,
                amount: orderTotal,
                orderInfo: `Thanh toan don hang ${orderId}`,
                orderType: 'other',
                locale: 'vn'
              },
              {
                withCredentials: true,
                headers: headers
              }
            );

            if (paymentRes.data.success && paymentRes.data.paymentUrl) {
              if (!user) {
                setCookie('cart', '');
              }
              console.log(paymentRes.data);
              
              window.location.replace(paymentRes.data.paymentUrl);
              setIsSubmitting(false);

              return;
            } else {
              console.log(paymentRes.data);
              
              throw new Error(paymentRes.data.message || 'Không thể tạo URL thanh toán');
            }
          } catch (paymentError) {
            console.log(paymentError);
            
            setIsSubmitting(false);
            await Swal.fire({
              icon: 'error',
              title: 'Lỗi thanh toán!',
              text: paymentError.response?.data?.message || paymentError.message || 'Không thể tạo URL thanh toán. Vui lòng thử lại.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#dc3545'
            });
            return;
          }
        }

        if (!user) {
          setCookie('cart', '');
        }
        
        await Swal.fire({
          icon: 'success',
          title: 'Đặt hàng thành công!',
          text: 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });

        navigate(`/orders/success?orderId=${orderId}&createdAt=${new Date().toISOString()}&total=${orderTotal}`);
        setIsSubmitting(false);
        return;
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
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

  if (cartItems.length === 0) {
    return (
      <>
        <section className="breadcrumb-section pt-0">
          <div className="container-fluid-lg">
            <div className="row">
              <div className="col-12">
                <div className="breadcrumb-contain">
                  <h2>Thanh toán</h2>
                  <nav>
                    <ol className="breadcrumb mb-0">
                      <li className="breadcrumb-item">
                        <Link to="/">
                          <i className="fa-solid fa-house" />
                        </Link>
                      </li>
                      <li className="breadcrumb-item active">Thanh toán</li>
                    </ol>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="cart-section section-b-space">
          <div className="container-fluid-lg">
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
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="breadcrumb-section pt-0">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb-contain">
                <h2>Thanh toán</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/">
                        <i className="fa-solid fa-house" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item active">Thanh toán</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="cart-section section-b-space">
        <div className="container-fluid-lg">
          <div className="row g-sm-5 g-3">
            <div className="col-xxl-9">
              <div className="cart-table">
                <div className="table-responsive-xl">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin giao hàng</h2>
                    
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Nhập họ và tên"
                          className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          autoComplete="name"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Nhập email"
                          className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          autoComplete="email"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Nhập số điện thoại"
                          className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          autoComplete="tel"
                        />
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                          Địa chỉ giao hàng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Nhập địa chỉ giao hàng chi tiết"
                          rows={4}
                          className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Phương thức thanh toán <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={formData.paymentMethod === 'cod'}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="font-medium text-gray-900">Thanh toán khi nhận hàng (COD)</div>
                              <div className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
                            </div>
                          </label>
                          <label className="flex items-center p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="bank"
                              checked={formData.paymentMethod === 'bank'}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="font-medium text-gray-900">Chuyển khoản ngân hàng</div>
                              <div className="text-sm text-gray-500">Chuyển khoản trước khi nhận hàng</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <Link
                          to="/cart"
                          className="flex-1 text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Quay lại giỏ hàng
                        </Link>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang xử lý...
                            </span>
                          ) : (
                            'Đặt hàng'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-3">
              <div className="summery-box p-sticky">
                <div className="summery-header">
                  <h3>Đơn hàng của bạn</h3>
                </div>
                <div className="summery-contain">
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cartItems.map((item) => {
                      const price = item.price || 0;
                      const itemTotal = price * (item.quantity || 1);

                      return (
                        <div key={item._id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md border border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Số lượng: {item.quantity || 1}
                            </p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(itemTotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="coupon-cart mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-content mb-0">Áp dụng mã giảm giá</h6>
                      <button
                        type="button"
                        onClick={handleOpenPromotionModal}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Xem tất cả mã
                      </button>
                    </div>
                    {promotion ? (
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-green-800">Mã: {promotion.code}</span>
                            <p className="text-xs text-green-600">{promotion.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemovePromotion}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-green-700">
                          Giảm: {promotion.discountType === 'percent' 
                            ? `${promotion.discountValue}%` 
                            : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promotion.discountValue)
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="mb-3 coupon-box input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập mã giảm giá..."
                          value={promotionCode}
                          onChange={(e) => setPromotionCode(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCheckPromotion();
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="btn-apply"
                          onClick={handleCheckPromotion}
                          disabled={checkingPromotion}
                        >
                          {checkingPromotion ? 'Đang kiểm tra...' : 'Áp dụng'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <ul className="summery-total">
                  <li>
                    <h4>Tạm tính</h4>
                    <h4 className="price">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateSubtotal())}
                    </h4>
                  </li>
                  {promotion && calculatePromotionDiscount() > 0 && (
                    <li>
                      <h4>Giảm giá ({promotion.code})</h4>
                      <h4 className="price theme-color">
                        (-) {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatePromotionDiscount())}
                      </h4>
                    </li>
                  )}
                  <li>
                    <h4>Phí vận chuyển</h4>
                    <h4 className="price text-end">Miễn phí</h4>
                  </li>
                  <li className="list-total border-top-0">
                    <h4>Tổng cộng (VND)</h4>
                    <h4 className="price theme-color">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                    </h4>
                  </li>
                </ul>
                {promotion && calculatePromotionDiscount() > 0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-center">
                    <p className="text-sm text-green-700">
                      Bạn đã tiết kiệm: <span className="font-semibold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatePromotionDiscount())}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showPromotionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowPromotionModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Danh sách mã khuyến mãi</h2>
              <button
                type="button"
                onClick={() => setShowPromotionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingPromotions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : allPromotions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không có mã khuyến mãi nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allPromotions.map((promo) => {
                    const isExpired = new Date(promo.endDate) < new Date();
                    const isNotStarted = new Date(promo.startDate) > new Date();
                    const isActive = promo.status === 'active' && !isExpired && !isNotStarted;
                    
                    return (
                      <div
                        key={promo._id}
                        className={`border rounded-lg p-4 ${
                          isActive
                            ? 'border-green-300 bg-green-50 hover:bg-green-100 cursor-pointer'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        } transition-colors`}
                        onClick={() => isActive && handleSelectPromotion(promo)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg text-blue-600">{promo.code}</span>
                              {!isActive && (
                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                                  {isExpired ? 'Hết hạn' : isNotStarted ? 'Chưa bắt đầu' : 'Không hoạt động'}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{promo.name}</h3>
                            {promo.description && (
                              <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Giảm giá:</span>
                            <span className="font-semibold text-green-600">
                              {promo.discountType === 'percent'
                                ? `${promo.discountValue}%`
                                : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.discountValue)
                              }
                            </span>
                          </div>
                          {promo.minOrderValue > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Đơn tối thiểu:</span>
                              <span className="font-medium text-gray-900">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.minOrderValue)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Hạn sử dụng:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        
                        {isActive && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <button
                              type="button"
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPromotion(promo);
                              }}
                            >
                              Áp dụng mã này
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
