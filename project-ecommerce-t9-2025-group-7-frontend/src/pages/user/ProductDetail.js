import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DOMAIN_SERVER } from '../../config/constants';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

  const getToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; tokenUser=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const addToCart = async () => {
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
          Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: res.data.message || 'Đã thêm sản phẩm vào giỏ hàng',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745',
            timer: 2000,
            timerProgressBar: true
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: res.data.message || 'Không thể thêm sản phẩm vào giỏ hàng',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: errorMessage,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    } else {
      try {
        const cartCookie = getCookie('cart');
        let cart = [];
        
        if (cartCookie) {
          cart = JSON.parse(decodeURIComponent(cartCookie));
        }
        
        const existingIndex = cart.findIndex(item => item._id === product._id);
        
        if (existingIndex >= 0) {
          cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
        } else {
          cart.push({
            _id: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? product.images[0].url : null,
            quantity: 1
          });
        }
        
        setCookie('cart', encodeURIComponent(JSON.stringify(cart)));
        
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Đã thêm sản phẩm vào giỏ hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 2000,
          timerProgressBar: true
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể thêm sản phẩm vào giỏ hàng',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
      }
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${DOMAIN_SERVER}/api/product/${slug}`);
      
      let productData = null;
      
      if (res.data && res.data._id) {
        productData = res.data;
      } else if (res.data && res.data.data && res.data.data._id) {
        productData = res.data.data;
      }
      
      if (productData) {
        setProduct(productData);
      } else {
        throw new Error('Product data not found');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không tìm thấy sản phẩm',
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

  if (!product) {
    return null;
  }

  const mainImage = product.images && product.images.length > 0 
    ? product.images[selectedImageIndex].url 
    : null;

  const sortedImages = product.images && product.images.length > 0
    ? [...product.images].sort((a, b) => (a.position || 0) - (b.position || 0))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div>
              {mainImage ? (
                <div className="mb-4">
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-96 object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {sortedImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image._id || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                        selectedImageIndex === index
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-4">
                {product.category && typeof product.category === 'object' && product.category.name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category.name}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name || 'Tên sản phẩm'}
              </h1>

              <div className="mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-4xl font-bold text-blue-600">
                    {(() => {
                      const price = product.price || 0;
                      const discount = product.discount || 0;
                      const priceAfterDiscount = price - (price * discount / 100);
                      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceAfterDiscount);
                    })()}
                  </span>
                  {product.discount > 0 && (
                    <del className="text-2xl text-gray-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price || 0)}
                    </del>
                  )}
                  {product.compare_price && (
                    <del className="text-2xl text-gray-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.compare_price)}
                    </del>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô tả sản phẩm</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {product.status === 'active' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Còn hàng
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Hết hàng
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200">
                {product.status === 'active' ? (
                  <button
                    onClick={addToCart}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm vào giỏ hàng
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Sản phẩm đã hết hàng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

