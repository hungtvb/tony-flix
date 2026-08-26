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
