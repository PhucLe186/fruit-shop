import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import JustValidate from 'just-validate';
import Swal from 'sweetalert2';
import { DOMAIN_SERVER } from '../../../config/constants';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    compare_price: '',
    description: '',
    position: '',
    status: 'active'
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const formRef = useRef(null);
  const validatorRef = useRef(null);
  const sortableContainerRef = useRef(null);
  const sortableInstanceRef = useRef(null);
  const existingImagesRef = useRef([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [id]);

  useEffect(() => {
    existingImagesRef.current = existingImages;
  }, [existingImages]);

  useEffect(() => {
    if (sortableContainerRef.current && existingImages.length > 0 && window.Sortable) {
      if (sortableInstanceRef.current) {
        sortableInstanceRef.current.destroy();
      }

      sortableInstanceRef.current = new window.Sortable(sortableContainerRef.current, {
        animation: 400,
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
            const currentImages = [...existingImagesRef.current];
            const [movedItem] = currentImages.splice(oldIndex, 1);
            currentImages.splice(newIndex, 0, movedItem);
            const updatedImages = currentImages.map((img, index) => ({
              ...img,
              position: index
            }));
            setExistingImages(updatedImages);
          }
        }
      });
    }

    return () => {
      if (sortableInstanceRef.current) {
        sortableInstanceRef.current.destroy();
        sortableInstanceRef.current = null;
      }
    };
  }, [existingImages.length]);

  useEffect(() => {
    if (formRef.current && !loading && !loadingCategories) {
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
        .addField('#name', [
          {
            rule: 'required',
            errorMessage: 'Tên sản phẩm không được để trống'
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: 'Tên sản phẩm phải có ít nhất 3 ký tự'
          },
          {
            rule: 'maxLength',
            value: 200,
            errorMessage: 'Tên sản phẩm không được vượt quá 200 ký tự'
          }
        ])
        .addField('#category', [
          {
            rule: 'required',
            errorMessage: 'Danh mục không được để trống'
          }
        ])
        .addField('#price', [
          {
            rule: 'required',
            errorMessage: 'Giá sản phẩm không được để trống'
          },
          {
            rule: 'custom',
            validator: (value) => {
              const numValue = parseFloat(value);
              return !isNaN(numValue) && numValue > 0;
            },
            errorMessage: 'Giá sản phẩm phải là số lớn hơn 0'
          }
        ]);
    }

    return () => {
      if (validatorRef.current) {
        validatorRef.current.destroy();
      }
    };
  }, [loading, loadingCategories]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await axios.get(`${DOMAIN_SERVER}/admin/product/category`);
      
      if (Array.isArray(res.data)) {
        setCategories(res.data.filter(cat => cat.status === 'active' && !cat.deleted));
      } else if (res.data && Array.isArray(res.data.data)) {
        setCategories(res.data.data.filter(cat => cat.status === 'active' && !cat.deleted));
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải danh sách danh mục',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const adminDataStr = localStorage.getItem('adminData');
      const params = {};
      
      if (adminDataStr) {
        const adminData = JSON.parse(adminDataStr);
        if (adminData._id) {
          params._id = adminData._id;
        }
      }
      
      const res = await axios.get(`${DOMAIN_SERVER}/admin/product/${id}`, {
        params: params
      });
      
      let productData = null;
      
      if (Array.isArray(res.data)) {
        productData = res.data.find(item => item._id === id);
      } else if (res.data && Array.isArray(res.data.data)) {
        productData = res.data.data.find(item => item._id === id);
      } else if (res.data && res.data.data) {
        productData = res.data.data;
      } else if (res.data && res.data._id) {
        productData = res.data;
      }
      
      if (productData) {
        setFormData({
          name: productData.name || '',
          category: productData.category?._id || productData.category || '',
          price: productData.price || '',
          compare_price: productData.compare_price || '',
          description: productData.description || '',
          position: productData.position || '',
          status: productData.status || 'active'
        });
        
        if (productData.images && Array.isArray(productData.images)) {
          setExistingImages(productData.images);
          existingImagesRef.current = productData.images;
        }
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể tải thông tin sản phẩm',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      navigate('/admin/product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...imageFiles, ...files];
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImageFiles(newFiles);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (_id) => {
    setExistingImages(prev => {
      const filtered = prev.filter(img => img._id !== _id);
      existingImagesRef.current = filtered;
      return filtered;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatorRef.current) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Form chưa được khởi tạo. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    
    const isValid = await validatorRef.current.validate();
    if (!isValid) {
      await Swal.fire({
        icon: 'warning',
        title: 'Vui lòng kiểm tra lại!',
        text: 'Vui lòng điền đầy đủ và đúng các trường bắt buộc.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    const adminDataStr = localStorage.getItem('adminData');
    if (!adminDataStr) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      navigate('/admin/login');
      return;
    }

    const adminData = JSON.parse(adminDataStr);
    if (!adminData._id) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Thông tin admin không hợp lệ. Vui lòng đăng nhập lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      navigate('/admin/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', parseFloat(formData.price));
      if (formData.compare_price) {
        formDataToSend.append('compare_price', parseFloat(formData.compare_price));
      }
      formDataToSend.append('description', formData.description || '');
      if (formData.position) {
        formDataToSend.append('position', parseInt(formData.position));
      }
      formDataToSend.append('status', formData.status);
      
      if (existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages.map((img, index) => ({
          url: img.url,
          public_id: img.public_id,
          position: index,
          _id: img._id
        }))));
      }
      
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const res = await axios.patch(`${DOMAIN_SERVER}/admin/product/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-admin-id': adminData._id,
        },
      });
      
      if (res.data.success === true) {
        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Sản phẩm đã được cập nhật thành công',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        });
        
        navigate('/admin/product');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: res.data.message || 'Cập nhật sản phẩm thất bại',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        
        navigate('/admin/product');
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm. Vui lòng thử lại.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      
      if (error.response?.data?.success === false) {
        navigate('/admin/product');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    fetchProduct();
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImageFiles([]);
    setImagePreviews([]);
    if (validatorRef.current) {
      validatorRef.current.refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white px-6 py-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chỉnh sửa sản phẩm</h2>
            <p className="text-gray-600">Cập nhật thông tin sản phẩm</p>
          </div>
          
          <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên sản phẩm"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loadingCategories}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Giá sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="Nhập giá sản phẩm"
                min="0"
                step="0.01"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="compare_price" className="block text-sm font-medium text-gray-700 mb-2">
                Giá so sánh
              </label>
              <input
                id="compare_price"
                name="compare_price"
                type="number"
                value={formData.compare_price}
                onChange={handleChange}
                placeholder="Nhập giá so sánh"
                min="0"
                step="0.01"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả chi tiết về sản phẩm"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                rows={5}
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Vị trí
              </label>
              <input
                id="position"
                name="position"
                type="number"
                value={formData.position}
                onChange={handleChange}
                placeholder="Nếu ko nhập sẽ tự động tăng"
                min="0"
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Hình ảnh
              </label>
              {existingImages.length > 0 && (
                <div ref={sortableContainerRef} className="mb-4 grid grid-cols-3 gap-4 sortable">
                  {existingImages.map((img, index) => (
                    <div key={img._id || index} data-id={img._id} className="relative cursor-move">
                      <img
                        src={img.url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-300"
                        draggable="false"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img._id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
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
                    Đang cập nhật...
                  </span>
                ) : (
                  'Cập nhật sản phẩm'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Làm mới
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/product')}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
