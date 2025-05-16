export const slugify = (val?: string): string => {
    if (!val) return '';
    return val.normalize('NFKD') // Tách ký tự có dấu thành ký tự cơ bản và dấu tách biệt
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .trim() // Xóa dấu cách đầu và cuối
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Xóa ký tự không phải chữ cái, số hoặc khoảng trắng
        .replace(/\s+/g, '-') // Chuyển khoảng trắng thành dấu '-'
        .replace(/-+/g, '-') // Xóa dấu '-' liên tiếp
};

export const sanitize = (val?: string): string => {
    if (!val) return '';
    return val
      .normalize('NFKD')                           // tách dấu ra
      .replace(/[\u0300-\u036f]/g, '')             // xóa dấu
      .replace(/[\s-]+/g, '_')                     // thay khoảng trắng và dấu '-' bằng '_'
      .replace(/[^a-zA-Z0-9._]/g, '')              // chỉ giữ a-z, A-Z, 0-9, . và _
      .replace(/_+/g, '_')                         // gộp nhiều dấu _ thành 1
      .replace(/^_+|_+$/g, '');                    // xóa dấu _ ở đầu/cuối nếu có
  };
  