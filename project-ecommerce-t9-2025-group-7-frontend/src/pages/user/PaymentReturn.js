import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const PaymentReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        const vnpParams = {};
        searchParams.forEach((value, key) => {
          vnpParams[key] = value;
        });

        const res = await axios.get(`${DOMAIN_SERVER}/api/payment/vnpay-return`, {
          params: vnpParams,
          withCredentials: true
        });

        setPaymentResult(res.data);
        setLoading(false);

        if (res.data.success) {
          const orderId = res.data.data?._id;
          
          if (user && orderId) {
            await Swal.fire({
              icon: 'success',
              title: 'Thanh toán thành công!',
              text: res.data.message || 'Đơn hàng của bạn đã được thanh toán thành công.',
              confirmButtonText: 'Xem đơn hàng',
              confirmButtonColor: '#28a745',
              timer: 3000,
              timerProgressBar: true
            });
            navigate(`/orders/${orderId}`);
          } else {
            await Swal.fire({
              icon: 'success',
              title: 'Thanh toán thành công!',
              text: res.data.message || 'Đơn hàng của bạn đã được thanh toán thành công.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745',
              timer: 3000,
              timerProgressBar: true
            });
            navigate('/');
          }
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Thanh toán thất bại!',
            text: res.data.message || 'Thanh toán không thành công. Vui lòng thử lại.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        console.error('Error processing payment return:', error);
        setLoading(false);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Có lỗi xảy ra khi xử lý kết quả thanh toán.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    };

    processPaymentReturn();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Đang xử lý kết quả thanh toán...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {paymentResult?.success ? (
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-600 mb-6">{paymentResult.message || 'Đơn hàng của bạn đã được thanh toán thành công.'}</p>
              
              {paymentResult.data && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-medium text-gray-900">#{paymentResult.data._id?.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng tiền:</span>
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentResult.data.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức thanh toán:</span>
                      <span className="font-medium text-gray-900">{paymentResult.data.paymentMethod || 'VNPay'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái thanh toán:</span>
                      <span className="font-medium text-green-600">Đã thanh toán</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Về trang chủ
                </Link>
                {paymentResult.data && user && (
                  <Link
                    to={`/orders/${paymentResult.data._id}`}
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Xem đơn hàng
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại!</h2>
              <p className="text-gray-600 mb-6">{paymentResult?.message || 'Thanh toán không thành công. Vui lòng thử lại.'}</p>
              
              <div className="flex gap-4 justify-center">
                <Link
                  to="/checkout"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Thử lại thanh toán
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;

