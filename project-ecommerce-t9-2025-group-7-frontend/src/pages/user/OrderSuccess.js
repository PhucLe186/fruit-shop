import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DOMAIN_SERVER } from '../../config/constants';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const vnpayMessage = searchParams.get('vnpay');
  const total = searchParams.get('total');
  const customer = searchParams.get('customer');
  const createdAtParam = searchParams.get('createdAt');

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const fetchOrderDetail = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN_SERVER}/api/order/${orderId}`, {
        withCredentials: true
      });

      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="mt-3">Đang tải thông tin đơn hàng...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayOrder = order || {
    _id: orderId,
    name: customer,
    total: total ? parseFloat(total) : 0,
    createdAt: createdAtParam || null,
    info_vnpay: {
      message: vnpayMessage || 'Giao dịch thành công'
    }
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="success-page">
            <div className="text-center mb-4">
              <div className="success-icon mb-3">
                <i className="fa-solid fa-circle-check" style={{ fontSize: '80px', color: '#28a745' }}></i>
              </div>
              <h2 className="text-success mb-2">Thanh toán thành công!</h2>
              <p className="text-muted">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xử lý thành công.</p>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fa-solid fa-receipt me-2"></i>
                  Thông tin đơn hàng
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Mã đơn hàng:</strong> 
                      <span className="ms-2 text-primary">{displayOrder._id}</span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-2">
                      <strong>Ngày đặt hàng:</strong> 
                      <span className="ms-2">{formatDate(displayOrder.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {displayOrder.name && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Khách hàng:</strong> 
                        <span className="ms-2">{displayOrder.name}</span>
                      </p>
                    </div>
                    {displayOrder.email && (
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Email:</strong> 
                          <span className="ms-2">{displayOrder.email}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {displayOrder.phone && (
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Số điện thoại:</strong> 
                        <span className="ms-2">{displayOrder.phone}</span>
                      </p>
                    </div>
                    {displayOrder.address && (
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Địa chỉ:</strong> 
                          <span className="ms-2">{displayOrder.address}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {vnpayMessage || (order && order.info_vnpay) ? (
                  <div className="alert alert-info mb-3">
                    <h6 className="alert-heading">
                      <i className="fa-solid fa-credit-card me-2"></i>
                      Thông tin thanh toán VNPay
                    </h6>
                    <hr />
                    <div className="row">
                      {displayOrder.info_vnpay && displayOrder.info_vnpay.message && (
                        <div className="col-md-12 mb-2">
                          <strong>Trạng thái:</strong> 
                          <span className="ms-2 text-success">{displayOrder.info_vnpay.message}</span>
                        </div>
                      )}
                      {displayOrder.info_vnpay && displayOrder.info_vnpay.vnp_TransactionNo && (
                        <div className="col-md-6 mb-2">
                          <strong>Mã giao dịch:</strong> 
                          <span className="ms-2">{displayOrder.info_vnpay.vnp_TransactionNo}</span>
                        </div>
                      )}
                      {displayOrder.info_vnpay && displayOrder.info_vnpay.vnp_BankCode && (
                        <div className="col-md-6 mb-2">
                          <strong>Ngân hàng:</strong> 
                          <span className="ms-2">{displayOrder.info_vnpay.vnp_BankCode}</span>
                        </div>
                      )}
                      {displayOrder.info_vnpay && displayOrder.info_vnpay.vnp_PayDate && (
                        <div className="col-md-6 mb-2">
                          <strong>Thời gian thanh toán:</strong> 
                          <span className="ms-2">{displayOrder.info_vnpay.vnp_PayDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning mb-3">
                    <h6 className="alert-heading">
                      <i className="fa-solid fa-money-bill-wave me-2"></i>
                      Phương thức thanh toán
                    </h6>
                    <hr />
                    <div className="row">
                      <div className="col-md-12">
                        <strong>Thanh toán khi nhận hàng (COD)</strong>
                        <p className="mb-0 mt-2 text-muted">
                          Bạn sẽ thanh toán khi nhận được hàng. Vui lòng chuẩn bị đúng số tiền để thanh toán cho nhân viên giao hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {order && order.info_product && order.info_product.length > 0 && (
                  <div className="table-responsive mb-3">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th>Sản phẩm</th>
                          <th className="text-center">Số lượng</th>
                          <th className="text-end">Đơn giá</th>
                          <th className="text-end">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.info_product.map((item, index) => {
                          const product = item.product || {};
                          const itemPrice = item.price || product.price || 0;
                          const discount = item.discount || 0;
                          const priceAfterDiscount = itemPrice - (itemPrice * discount) / 100;
                          const itemTotal = priceAfterDiscount * (item.quantity || 1);

                          return (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {product.images && product.images.length > 0 && (
                                    <img
                                      src={product.images[0].url}
                                      alt={product.name}
                                      className="me-3"
                                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                                      onError={(e) => {
                                        e.target.src = '/assets/images/vegetable/product/1.png';
                                      }}
                                    />
                                  )}
                                  <div>
                                    <h6 className="mb-0">{product.name || 'Sản phẩm'}</h6>
                                    {discount > 0 && (
                                      <small className="text-muted">Giảm {discount}%</small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center">{item.quantity || 1}</td>
                              <td className="text-end">{formatVND(priceAfterDiscount)} VND</td>
                              <td className="text-end">{formatVND(itemTotal)} VND</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6 offset-md-6">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tạm tính:</span>
                      <span>{formatVND(displayOrder.total)} VND</span>
                    </div>
                    {displayOrder.discount > 0 && (
                      <div className="d-flex justify-content-between mb-2 text-danger">
                        <span>Giảm giá:</span>
                        <span>-{formatVND(displayOrder.discount)} VND</span>
                      </div>
                    )}
                    <hr />
                    <div className="d-flex justify-content-between">
                      <strong>Tổng cộng:</strong>
                      <strong className="text-success" style={{ fontSize: '1.2rem' }}>
                        {formatVND(displayOrder.total)} VND
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h6 className="mb-3">
                  <i className="fa-solid fa-info-circle me-2 text-info"></i>
                  Lưu ý
                </h6>
                <ul className="mb-0">
                  <li>Đơn hàng của bạn đã được xác nhận và đang được xử lý.</li>
                  <li>Bạn sẽ nhận được email xác nhận đơn hàng trong thời gian sớm nhất.</li>
                  <li>Bạn có thể theo dõi đơn hàng bằng mã đơn hàng: <strong>{displayOrder._id}</strong></li>
                  {order && order.status && (
                    <li>Trạng thái đơn hàng: <strong className="text-warning">{order.status}</strong></li>
                  )}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link to="/" className="btn btn-outline-primary me-2">
                <i className="fa-solid fa-home me-2"></i>
                Về trang chủ
              </Link>
              {orderId && (
                <Link to={`/orders/${orderId}`} className="btn btn-primary me-2">
                  <i className="fa-solid fa-eye me-2"></i>
                  Xem chi tiết đơn hàng
                </Link>
              )}
              <Link to="/orders" className="btn btn-success">
                <i className="fa-solid fa-list me-2"></i>
                Danh sách đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

