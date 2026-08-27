/** Danh mục đã verify qua probe NguonC API 26/08 (slugs 404 đã loại bỏ). */

export interface CategoryOption {
  slug: string
  name: string
}

export const GENRES: CategoryOption[] = [
  { slug: 'hanh-dong', name: 'Hành Động' },
  { slug: 'kinh-di', name: 'Kinh Dị' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình' },
  { slug: 'co-trang', name: 'Cổ Trang' },
  { slug: 'khoa-hoc-vien-tuong', name: 'Viễn Tưởng' },
  { slug: 'tinh-cam', name: 'Tình Cảm' },
  { slug: 'tam-ly', name: 'Tâm Lý' },
  { slug: 'hinh-su', name: 'Hình Sự' },
  { slug: 'phieu-luu', name: 'Phiêu Lưu' },
]

export const COUNTRIES: CategoryOption[] = [
  { slug: 'han-quoc', name: 'Hàn Quốc' },
  { slug: 'trung-quoc', name: 'Trung Quốc' },
  { slug: 'nhat-ban', name: 'Nhật Bản' },
  { slug: 'thai-lan', name: 'Thái Lan' },
  { slug: 'an-do', name: 'Ấn Độ' },
]

export function displayName(list: CategoryOption[], slug: string): string {
  return list.find((c) => c.slug === slug)?.name ?? decodeURIComponent(slug)
}

/** Các năm phát hành phổ biến để duyệt nhanh (mới → cũ). */
export const YEARS: CategoryOption[] = [
  { slug: '2026', name: '2026' },
  { slug: '2025', name: '2025' },
  { slug: '2024', name: '2024' },
  { slug: '2023', name: '2023' },
  { slug: '2022', name: '2022' },
  { slug: '2021', name: '2021' },
  { slug: '2020', name: '2020' },
  { slug: '2019', name: '2019' },
  { slug: '2018', name: '2018' },
  { slug: '2017', name: '2017' },
  { slug: '2016', name: '2016' },
  { slug: '2015', name: '2015' },
]
