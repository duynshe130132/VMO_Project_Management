module.exports = {
    preset: 'ts-jest', // Sử dụng ts-jest cho TypeScript
    testEnvironment: 'node', // Môi trường chạy test, ở đây là môi trường Node.js
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1', // Ánh xạ đường dẫn 'src/' thành <rootDir>/src/
    },
    transform: {
        '^.+\\.ts$': 'ts-jest', // Sử dụng ts-jest để transform các tệp .ts
    },
    moduleDirectories: ['node_modules', 'src'], // Thêm 'src' vào để Jest có thể tìm các mô-đun từ thư mục 'src'
};
