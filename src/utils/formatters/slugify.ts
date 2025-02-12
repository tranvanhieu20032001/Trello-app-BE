//Thay val: string | null | undefined thành val?: string
//val? là cách viết gọn trong TypeScript, tương đương với val: string | undefined.
//Hạn chế cần kiểm tra null vì TypeScript tự hiểu undefined là giá trị mặc định.

export const slugify = (val?: string): string => {
    if (!val) return '';
    return val.normalize('NFKD') // Tách ký tự có dấu thành ký tự cơ bản và dấu tách biệt
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .trim() // Xóa dấu cách đầu và cuối
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Xóa ký tự không phải chữ cái, số hoặc khoảng trắng
        .replace(/\s+/g, '-') // Chuyển khoảng trắng thành dấu '-'
        .replace(/-+/g, '-') // Xóa dấu '-' liên tiếp
}