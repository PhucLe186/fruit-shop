import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import CreateCategory from "./pages/admin/product/category/CreateCategory";
import EditCategory from "./pages/admin/product/category/EditCategory";
import CategoryList from "./pages/admin/product/category/CategoryList";
import ProductList from "./pages/admin/product/ProductList";
import CreateProduct from "./pages/admin/product/CreateProduct";
import EditProduct from "./pages/admin/product/EditProduct";
import RoleList from "./pages/admin/role/RoleList";
import CreateRole from "./pages/admin/role/CreateRole";
import EditRole from "./pages/admin/role/EditRole";
import AccountAdminList from "./pages/admin/account-admin/AccountAdminList";
import CreateAccountAdmin from "./pages/admin/account-admin/CreateAccountAdmin";
import EditAccountAdmin from "./pages/admin/account-admin/EditAccountAdmin";
import OrderList from "./pages/admin/order/OrderList";
import PromotionList from "./pages/admin/promotion/PromotionList";
import CreatePromotion from "./pages/admin/promotion/CreatePromotion";
import EditPromotion from "./pages/admin/promotion/EditPromotion";
import LoginAdmin from "./pages/admin/LoginAdmin";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Home from "./pages/user/Home";
import Cart from "./pages/user/Cart";
import Checkout from "./pages/user/Checkout";
import ProductDetail from "./pages/user/ProductDetail";
import ProductListUser from "./pages/user/ProductList";
import CategoryPage from "./pages/user/CategoryPage";
import SignUp from "./pages/user/SignUp";
import Login from "./pages/user/Login";
import PaymentReturn from "./pages/user/PaymentReturn";
import Orders from "./pages/user/Orders";
import OrderDetail from "./pages/user/OrderDetail";
import TrackOrder from "./pages/user/TrackOrder";
import OrderSuccess from "./pages/user/OrderSuccess";
import "./App.css";
import UserLayout from "./layouts/UserLayout";
import ScriptLoader from "./components/ScriptLoader";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScriptLoader />
        <Routes>
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/product/category" replace />} />
          <Route path="product/category/create" element={<CreateCategory />} />
          <Route path="product/category/:id" element={<EditCategory />} />
          <Route path="product/category" element={<CategoryList />} />
          <Route path="product/create" element={<CreateProduct />} />
          <Route path="product" element={<ProductList />} />
          <Route path="product/:id" element={<EditProduct />} />
          <Route path="role/create" element={<CreateRole />} />
          <Route path="role/:id" element={<EditRole />} />
          <Route path="role" element={<RoleList />} />
          <Route path="account/create" element={<CreateAccountAdmin />} />
          <Route path="account/:id" element={<EditAccountAdmin />} />
          <Route path="account" element={<AccountAdminList />} />
          <Route path="order" element={<OrderList />} />
          <Route path="promotion/create" element={<CreatePromotion />} />
          <Route path="promotion/:id/update" element={<EditPromotion />} />
          <Route path="promotion" element={<PromotionList />} />
        </Route>
        <Route element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="product" element={<ProductListUser />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/success" element={<OrderSuccess />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="track-order" element={<TrackOrder />} />
          <Route path="payment/return" element={<PaymentReturn />} />
          <Route path="sign-up" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path=":slug" element={<ProductDetail />} />
        </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
