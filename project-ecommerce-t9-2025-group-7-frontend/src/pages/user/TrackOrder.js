import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../config/constants';

const TrackOrder = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [orders, setOrders] = useState([]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng nhập email',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    setSendingOTP(true);

    try {
      const res = await axios.post(`${DOMAIN_SERVER}/api/order/track/send-otp`, {
        email: email.trim()
      });

      if (res.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: res.data.message || 'Đã gửi mã OTP qua email. Vui lòng kiểm tra hộp thư của bạn.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        setStep(2);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không thể gửi mã OTP',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi gửi mã OTP',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setSendingOTP(false);
    }
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !otp.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Thiếu thông tin',
        text: 'Vui lòng nhập đầy đủ email và mã OTP',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${DOMAIN_SERVER}/api/order/track`, {
        email: email.trim(),
        otp: otp.trim()
      });

      if (res.data.success) {
        setOrders(res.data.data || []);
        if (res.data.data && res.data.data.length === 0) {
          await Swal.fire({
            icon: 'info',
            title: 'Không có đơn hàng',
            text: 'Không tìm thấy đơn hàng nào với email này',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6'
          });
        }
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Không thể tra cứu đơn hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi tra cứu đơn hàng',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setOtp('');
    setOrders([]);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800',
      failed: 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <section className="breadcrumb-section pt-0">
        <div className="container-fluid-lg">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb-contain">
                <h2>Tra cứu đơn hàng</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/">
                        <i className="fa-solid fa-house" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item active">Tra cứu đơn hàng</li>
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        {step > 1 ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold">1</span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium">Gửi OTP</span>
                    </div>
                    <div className="w-12 h-0.5 bg-gray-300"></div>
                    <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <span className="text-sm font-semibold">2</span>
                      </div>
                      <span className="ml-2 text-sm font-medium">Tra cứu</span>
                    </div>
                  </div>
                </div>

                {step === 1 ? (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Bước 1: Gửi mã OTP</h2>
                    <p className="text-gray-600 mb-6">
                      Nhập email đã sử dụng khi đặt hàng để nhận mã OTP tra cứu đơn hàng
                    </p>

                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Nhập email đã sử dụng khi đặt hàng"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingOTP}
                        className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingOTP ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang gửi...
                          </span>
                        ) : (
                          'Gửi mã OTP'
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Bước 2: Nhập mã OTP</h2>
                    <p className="text-gray-600 mb-6">
                      Nhập mã OTP đã được gửi đến email <strong>{email}</strong>
                    </p>

                    <form onSubmit={handleTrackOrder} className="space-y-4">
                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                          Mã OTP <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="otp"
                          name="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Nhập mã OTP 6 số"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                          maxLength={6}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Mã OTP có hiệu lực trong 5 phút
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={handleBackToStep1}
                          className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Quay lại
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang tra cứu...
                            </span>
                          ) : (
                            'Tra cứu đơn hàng'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {orders.length > 0 && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Danh sách đơn hàng ({orders.length})
                    </h3>
                  </div>

                  {orders.map((order) => (
                    <div key={order._id} className="space-y-6">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Đơn hàng #{order._id.slice(-8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Ngày đặt: {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.statusLabel}
                            </span>
                            <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatusLabel}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200 mb-6">
                          <div>
                            <p className="text-sm text-gray-600">Tổng tiền</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              {order.paymentMethod || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {formatDate(order.updatedAt)}
                            </p>
                          </div>
                        </div>

                        {Array.isArray(order.info_product) && order.info_product.length > 0 && (
                          <div className="pt-6 border-t border-gray-200 mb-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h4>
                            <div className="space-y-3">
                              {order.info_product.map((item, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  {item.product && item.product.images && item.product.images.length > 0 ? (
                                    <img
                                      src={item.product.images[0].url}
                                      alt={item.product.name}
                                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.product ? item.product.name : 'Sản phẩm đã bị xóa'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Số lượng: {item.quantity} x {formatPrice(item.price)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formatPrice((item.price || 0) * (item.quantity || 1))}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-6 border-t border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900 mb-6">Tiến trình đơn hàng</h4>
                          
                          <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            
                            <div className="space-y-8">
                              {order.timeline.map((item, index) => {
                                const isLast = index === order.timeline.length - 1;
                                const isCompleted = item.isCompleted || (item.type === 'payment' && item.isCompleted);
                                const isActive = item.isActive;
                                const borderColor = isCompleted ? 'border-green-500' : isActive ? 'border-blue-500' : 'border-gray-300';
                                const bgColor = isCompleted ? 'bg-green-50' : isActive ? 'bg-blue-50' : 'bg-white';
                                
                                return (
                                  <div key={index} className="relative flex items-start">
                                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${bgColor} border-2 ${borderColor}`}>
                                      {isCompleted ? (
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      ) : isActive ? (
                                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                                      ) : (
                                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                      )}
                                    </div>
                                    
                                    <div className={`ml-4 flex-1 pb-8 ${isLast ? '' : 'border-b border-gray-100'}`}>
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h5 className={`text-base font-semibold ${
                                            isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                                          }`}>
                                            {item.statusLabel || (item.type === 'payment' ? 'Thanh toán thành công' : '')}
                                          </h5>
                                          <p className="text-sm text-gray-600 mt-1">
                                            {item.description}
                                          </p>
                                          {item.date && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              {formatDate(item.date)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">Tiến độ đơn hàng</p>
                                <p className="text-lg font-semibold text-gray-900 mt-1">
                                  {order.currentStep} / {order.maxStep} bước
                                </p>
                              </div>
                              <div className="w-48">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                      order.currentStep === order.maxStep
                                        ? 'bg-green-500'
                                        : order.currentStep > 0
                                        ? 'bg-blue-500'
                                        : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${(order.currentStep / order.maxStep) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TrackOrder;
