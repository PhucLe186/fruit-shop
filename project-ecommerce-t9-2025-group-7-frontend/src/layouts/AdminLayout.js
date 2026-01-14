import { Outlet, Link, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/admin/product" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/product') && !isActive('/admin/product/category') && !isActive('/admin/product/create')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Danh sách sản phẩm
          </Link>
          <Link 
            to="/admin/product/create" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/product/create') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Thêm sản phẩm
          </Link>
          <Link 
            to="/admin/product/category" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/product/category') && !isActive('/admin/product/category/create')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Danh sách danh mục
          </Link>
          <Link 
            to="/admin/product/category/create" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/product/category/create') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Thêm danh mục
          </Link>
          <Link 
            to="/admin/role" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/role') && !isActive('/admin/role/create')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Nhóm quyền
          </Link>
          <Link 
            to="/admin/role/create" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/role/create') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Thêm nhóm quyền
          </Link>
          <Link 
            to="/admin/account" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/account')  && !isActive('/admin/account/create')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Tài khoản admin
          </Link>
          <Link 
            to="/admin/account/create" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/account/create')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Thêm mới tài khoản admin
          </Link>
          <Link 
            to="/admin/order" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/order') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Đơn hàng
          </Link>
          <Link 
            to="/admin/promotion" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/promotion') && !isActive('/admin/promotion/create') && !isActive('/admin/promotion/update')
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Mã khuyến mãi
          </Link>
          <Link 
            to="/admin/promotion/create" 
            className={`block px-4 py-3 rounded-lg transition-colors ${
              isActive('/admin/promotion/create') 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Thêm mã khuyến mãi
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Trang quản trị</h1>
        </header>
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

