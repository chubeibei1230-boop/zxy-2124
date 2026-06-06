import type { Area, InventoryItem } from '../types';
import { generateId } from './helpers';

export function createMockAreas(): Area[] {
  return [
    { id: generateId(), name: 'A区-电子产品', createdAt: Date.now() },
    { id: generateId(), name: 'B区-日用品', createdAt: Date.now() },
    { id: generateId(), name: 'C区-食品饮料', createdAt: Date.now() },
    { id: generateId(), name: 'D区-服装鞋帽', createdAt: Date.now() },
  ];
}

export function createMockItems(areas: Area[]): InventoryItem[] {
  const items: InventoryItem[] = [];
  const products = [
    { sku: 'SKU001', name: '无线蓝牙耳机', area: 0, qty: 50 },
    { sku: 'SKU002', name: '充电宝 20000mAh', area: 0, qty: 30 },
    { sku: 'SKU003', name: 'USB-C 数据线', area: 0, qty: 100 },
    { sku: 'SKU004', name: '手机支架', area: 0, qty: 25 },
    { sku: 'SKU005', name: '蓝牙音箱', area: 0, qty: 15 },
    { sku: 'SKU006', name: '洗衣液 2L', area: 1, qty: 40 },
    { sku: 'SKU007', name: '抽纸 3层*10包', area: 1, qty: 80 },
    { sku: 'SKU008', name: '牙膏 180g', area: 1, qty: 60 },
    { sku: 'SKU009', name: '沐浴露 500ml', area: 1, qty: 35 },
    { sku: 'SKU010', name: '毛巾 纯棉', area: 1, qty: 45 },
    { sku: 'SKU011', name: '矿泉水 550ml*24', area: 2, qty: 120 },
    { sku: 'SKU012', name: '可乐 330ml*24', area: 2, qty: 90 },
    { sku: 'SKU013', name: '方便面 5连包', area: 2, qty: 70 },
    { sku: 'SKU014', name: '饼干 巧克力味', area: 2, qty: 55 },
    { sku: 'SKU015', name: '坚果礼盒', area: 2, qty: 20 },
    { sku: 'SKU016', name: '男士T恤 纯棉', area: 3, qty: 30 },
    { sku: 'SKU017', name: '女士连衣裙', area: 3, qty: 25 },
    { sku: 'SKU018', name: '运动鞋 跑步款', area: 3, qty: 18 },
    { sku: 'SKU019', name: '棒球帽', area: 3, qty: 40 },
    { sku: 'SKU020', name: '袜子 5双装', area: 3, qty: 65 },
  ];

  products.forEach(p => {
    items.push({
      id: generateId(),
      sku: p.sku,
      name: p.name,
      areaId: areas[p.area].id,
      expectedQty: p.qty,
      actualQty: null,
      note: '',
      isOutOfStock: false,
      isConfirmed: false,
      hasDifference: false,
      prevQty: null,
      reviewConclusion: '',
      handlingOpinion: '',
      responsibilityAttribution: '',
      reviewStatus: 'pending',
      reviewedAt: null,
      closingProgress: '',
      expectedClosingDate: '',
      finalResult: '',
      closingStatus: 'notStarted',
      closedAt: null,
    });
  });

  return items;
}
