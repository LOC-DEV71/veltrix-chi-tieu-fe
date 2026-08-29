import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <Link to="/login" className="terms-back-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Quay lại đăng nhập
        </Link>
        
        <h1 className="terms-title">Điều khoản & Chính sách</h1>
        <div className="terms-updated">Cập nhật lần cuối: 29/08/2026</div>

        <div className="terms-content">
          <h3>1. Chấp nhận điều khoản</h3>
          <p>
            Bằng việc truy cập và sử dụng ứng dụng MoneyFlow, bạn đồng ý tuân thủ các điều khoản và điều kiện được mô tả tại đây. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>

          <h3>2. Bảo mật dữ liệu và Quyền riêng tư</h3>
          <p>
            Quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Chúng tôi cam kết:
          </p>
          <ul>
            <li>Không bao giờ bán dữ liệu cá nhân hay thông tin tài chính của bạn cho bên thứ ba.</li>
            <li>Sử dụng các tiêu chuẩn mã hóa bảo mật cao nhất để bảo vệ dữ liệu truyền tải.</li>
            <li>Chỉ thu thập các thông tin cần thiết nhằm cải thiện trải nghiệm ứng dụng (địa chỉ email, tên hiển thị).</li>
          </ul>

          <h3>3. Trách nhiệm người dùng</h3>
          <p>
            Bạn có trách nhiệm bảo mật thông tin tài khoản (email và mật khẩu). MoneyFlow sẽ không chịu trách nhiệm cho bất kỳ rủi ro nào phát sinh từ việc bạn vô ý hoặc cố ý để lộ thông tin đăng nhập cho người khác.
          </p>

          <h3>4. Thay đổi điều khoản</h3>
          <p>
            Chúng tôi có quyền sửa đổi và cập nhật chính sách bất kỳ lúc nào. Những thay đổi sẽ được thông báo ngay trên ứng dụng và có hiệu lực lập tức kể từ thời điểm đăng tải.
          </p>

          <h3>5. Liên hệ</h3>
          <p>
            Mọi thắc mắc về điều khoản hoặc cần hỗ trợ về quyền riêng tư, vui lòng liên hệ với đội ngũ phát triển qua email: <strong>support@moneyflow.vn</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
