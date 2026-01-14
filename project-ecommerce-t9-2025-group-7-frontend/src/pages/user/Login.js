import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { DOMAIN_SERVER } from "../../config/constants";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setUserDirectly } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const setCookie = (name, value, days = 30) => {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Vui lòng điền đầy đủ thông tin",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${DOMAIN_SERVER}/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (res.data.token && res.data.user) {
        setCookie("tokenUser", res.data.token);
        
        const userData = {
          _id: res.data.user.id,
          fullname: res.data.user.fullname,
          username: res.data.user.username,
          email: res.data.user.email,
          phone: res.data.user.phone,
        };
        setUserDirectly(userData);
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: res.data.message || "Đăng nhập thành công!",
          confirmButtonText: "OK",
          confirmButtonColor: "#28a745",
        }).then(() => {
          navigate("/");
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!";
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: errorMessage,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="log-in-section section-b-space">
        <div className="container-fluid-lg w-100">
          <div className="row">
            <div className="col-xxl-6 col-xl-5 col-lg-6 d-lg-block d-none ms-auto">
              <div className="image-contain">
                <img
                  alt=""
                  className="img-fluid"
                  src="../assets/images/inner-page/log-in.png"
                />
              </div>
            </div>
            <div className="col-xxl-4 col-xl-5 col-lg-6 col-sm-8 mx-auto">
              <div className="log-in-box">
                <div className="log-in-title">
                  <h3>Chào mừng đến với Fastkart</h3>
                  <h4>Đăng nhập vào tài khoản của bạn</h4>
                </div>
                <div className="input-box">
                  <form className="row g-4" onSubmit={handleSubmit}>
                    <div className="col-12">
                      <div className="form-floating theme-form-floating">
                        <input
                          className="form-control"
                          id="email"
                          name="email"
                          placeholder="Địa chỉ Email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="email">Địa chỉ Email</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-floating theme-form-floating">
                        <input
                          className="form-control"
                          id="password"
                          name="password"
                          placeholder="Mật khẩu"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <label htmlFor="password">Mật khẩu</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="forgot-box">
                        <div className="form-check ps-0 m-0 remember-box">
                          <input
                            className="checkbox_animated check-box"
                            id="flexCheckDefault"
                            type="checkbox"
                          />
                          <label
                            className="form-check-label"
                            htmlFor="flexCheckDefault"
                          >
                            Ghi nhớ đăng nhập
                          </label>
                        </div>
                        <a href="forgot.html">Quên mật khẩu?</a>
                      </div>
                    </div>
                    <div className="col-12">
                      <button
                        className="btn btn-animation w-100"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                      </button>
                    </div>
                  </form>
                </div>
                <div className="other-log-in">
                  <h6>hoặc</h6>
                </div>
                <div className="log-in-button">
                  <ul>
                    <li>
                      <a
                        className="btn google-button w-100"
                        href="https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin"
                      >
                        <img
                          alt=""
                          className="blur-up lazyload"
                          src="../assets/images/inner-page/google.png"
                        />
                        Đăng nhập với Google
                      </a>
                    </li>
                    <li>
                      <a
                        className="btn google-button w-100"
                        href="https://www.facebook.com/"
                      >
                        <img
                          alt=""
                          className="blur-up lazyload"
                          src="../assets/images/inner-page/facebook.png"
                        />{" "}
                        Đăng nhập với Facebook
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="other-log-in">
                  <h6 />
                </div>
                <div className="sign-up-box">
                  <h4>Chưa có tài khoản?</h4>
                  <Link to="/sign-up">Đăng ký</Link>
                </div>
              </div>
            </div>
            <div className="col-xxl-7 col-xl-6 col-lg-6" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;

