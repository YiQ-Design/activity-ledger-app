import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Archive,
  ArrowLeft,
  Battery,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  ListChecks,
  MoreHorizontal,
  Info,
  Plus,
  Search,
  SlidersHorizontal,
  UsersRound,
  Wifi,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'activity-ledger-activities-v2';
const MANUAL_ASSETS_KEY = 'activity-ledger-manual-assets-v1';
const OLD_STORAGE_KEY = 'activity-ledger-first-event-v1';

const activityTypes = [
  { id: 'camping', name: '露营', icon: '🏕️' },
  { id: 'party', name: '轰趴', icon: '🎉' },
  { id: 'ktv', name: 'KTV', icon: '🎤' },
  { id: 'bar', name: '酒吧局', icon: '🍷' },
  { id: 'birthday', name: '生日局', icon: '🎂' },
  { id: 'market', name: '市集', icon: '🛍️' },
  { id: 'team_building', name: '团建', icon: '🏢' },
  { id: 'other', name: '其他', icon: '📦' },
];
const defaultActivityType = activityTypes[0];
const purchaseCategories = ['酒水', '食物', '交通', '布置', '场地', '人工', '其他'];
const assetCategories = ['露营装备', '灯光音响', '桌椅道具', '装饰布置', '餐具用品', '拍摄设备', '其他'];
const recentPurchaseChannels = ['淘宝', '京东', '拼多多', '微信转账'];
const purchaseChannelGroups = [
  { title: '最近使用', options: recentPurchaseChannels },
  { title: '电商平台', options: ['淘宝', '京东', '拼多多', '抖音', '小红书'] },
  { title: '即时零售 / 生鲜', options: ['盒马', '美团'] },
  { title: '线下', options: ['线下超市', '批发市场'] },
  { title: '其他', options: ['微信转账', '其他'] },
];

function App() {
  const [activities, setActivities] = useState(loadActivities);
  const [manualAssets, setManualAssets] = useState(loadManualAssets);
  const [activeTab, setActiveTab] = useState('home');
  const [screen, setScreen] = useState({ name: 'tab' });
  const [purchasePrefill, setPurchasePrefill] = useState({});
  const [homeMonth, setHomeMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(MANUAL_ASSETS_KEY, JSON.stringify(manualAssets));
  }, [manualAssets]);

  const selectedActivity = screen.activityId ? activities.find((activity) => activity.id === screen.activityId) : null;
  const selectedPurchase = selectedActivity && screen.purchaseId ? selectedActivity.purchases.find((purchase) => purchase.id === screen.purchaseId) : null;
  const assets = [...getAssets(activities), ...manualAssets];
  const selectedAsset = screen.assetId ? assets.find((asset) => asset.id === screen.assetId) : null;

  function goHome() {
    setActiveTab('home');
    setScreen({ name: 'tab' });
  }

  function openDetail(activityId, source = activeTab) {
    setScreen({ name: 'detail', activityId, source });
  }

  function createActivity(draft) {
    const now = new Date().toISOString();
    const activity = {
      id: Date.now().toString(),
      name: draft.name.trim(),
      date: draft.date,
      peopleCount: Number(draft.peopleCount) || 0,
      unitPrice: Number(draft.unitPrice) || 0,
      expectedIncome: Number(draft.expectedIncome) || 0,
      type: draft.type,
      status: 'preparing',
      purchases: [],
      createdAt: now,
      updatedAt: now,
    };
    setActivities((current) => [activity, ...current]);
    const activityDate = parseDateValue(activity.date);
    setHomeMonth(activityDate ? new Date(activityDate.getFullYear(), activityDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setActiveTab('home');
    setScreen({ name: 'tab' });
  }

  function updateActivity(activityId, draft) {
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              name: draft.name.trim(),
              date: draft.date,
              peopleCount: Number(draft.peopleCount) || 0,
              unitPrice: Number(draft.unitPrice) || 0,
              expectedIncome: Number(draft.expectedIncome) || 0,
              type: draft.type,
              updatedAt: new Date().toISOString(),
            }
          : activity,
      ),
    );
    setScreen({ name: 'detail', activityId, source: screen.source || 'home' });
  }

  function savePurchase(activityId, draft) {
    const now = new Date().toISOString();
    const purchase = {
      id: Date.now().toString(),
      activityId,
      name: draft.name.trim(),
      amount: Number(draft.amount) || 0,
      platform: draft.platform.trim(),
      category: draft.category,
      isPaid: draft.isPaid,
      isArrived: draft.isArrived,
      isReusable: draft.isReusable,
      note: draft.note.trim(),
      reuseCount: 0,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? { ...activity, purchases: [purchase, ...activity.purchases], updatedAt: now }
          : activity,
      ),
    );
    setScreen({ name: 'detail', activityId, source: screen.source || 'home' });
  }

  function updatePurchase(activityId, purchaseId, draft) {
    const now = new Date().toISOString();
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              purchases: activity.purchases.map((purchase) =>
                purchase.id === purchaseId
                  ? {
                      ...purchase,
                      name: draft.name.trim(),
                      amount: Number(draft.amount) || 0,
                      platform: draft.platform.trim(),
                      category: draft.category,
                      isPaid: draft.isPaid,
                      isArrived: draft.isArrived,
                      isReusable: draft.isReusable,
                      note: draft.note.trim(),
                      updatedAt: now,
                    }
                  : purchase,
              ),
              updatedAt: now,
            }
          : activity,
      ),
    );
    setScreen({ name: 'detail', activityId, source: screen.source || 'home' });
  }

  function deletePurchase(activityId, purchaseId) {
    const now = new Date().toISOString();
    setActivities((current) =>
      current.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              purchases: activity.purchases.filter((purchase) => purchase.id !== purchaseId),
              updatedAt: now,
            }
          : activity,
      ),
    );
    setScreen({ name: 'detail', activityId, source: screen.source || 'home' });
  }

  function deleteActivity(activityId) {
    setActivities((current) => current.filter((activity) => activity.id !== activityId));
    goHome();
  }

  function saveAsset(draft) {
    const now = new Date().toISOString();
    const asset = {
      id: `manual-${Date.now()}`,
      name: draft.name.trim(),
      category: draft.category,
      value: Number(draft.value) || 0,
      quantity: Number(draft.quantity) || 1,
      source: 'manual',
      reuseCount: 0,
      lastUsedAt: '',
      note: draft.note.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setManualAssets((current) => [asset, ...current]);
    setActiveTab('assets');
    setScreen({ name: 'tab' });
  }

  function updateAsset(assetId, draft) {
    const now = new Date().toISOString();
    const value = Number(draft.value) || 0;
    const quantity = Number(draft.quantity) || 1;
    const manualId = assetId.replace(/^manual-/, '');

    setManualAssets((current) =>
      current.map((asset) =>
        asset.id === assetId || asset.id === manualId
          ? { ...asset, name: draft.name.trim(), category: draft.category, value, quantity, note: draft.note.trim(), updatedAt: now }
          : asset,
      ),
    );

    if (draft.source === 'purchase') {
      setActivities((current) =>
        current.map((activity) =>
          activity.id === draft.sourceActivityId
            ? {
                ...activity,
                purchases: activity.purchases.map((purchase) =>
                  purchase.id === draft.sourcePurchaseId
                    ? { ...purchase, name: draft.name.trim(), category: draft.category, amount: value, assetQuantity: quantity, note: draft.note.trim(), updatedAt: now }
                    : purchase,
                ),
                updatedAt: now,
              }
            : activity,
        ),
      );
    }

    setActiveTab('assets');
    setScreen({ name: 'tab' });
  }

  function deleteAsset(asset) {
    if (asset.source === 'purchase') {
      const now = new Date().toISOString();
      setActivities((current) =>
        current.map((activity) =>
          activity.id === asset.sourceActivityId
            ? {
                ...activity,
                purchases: activity.purchases.map((purchase) =>
                  purchase.id === asset.sourcePurchaseId ? { ...purchase, isReusable: false, updatedAt: now } : purchase,
                ),
                updatedAt: now,
              }
            : activity,
        ),
      );
    } else {
      setManualAssets((current) => current.filter((item) => item.id !== asset.id));
    }
    setActiveTab('assets');
    setScreen({ name: 'tab' });
  }

  if (screen.name === 'create') {
    return <ActivityForm mode="create" onBack={goHome} onSave={createActivity} />;
  }

  if (screen.name === 'edit' && selectedActivity) {
    return (
      <ActivityForm
        mode="edit"
        activity={selectedActivity}
        onBack={() => setScreen({ name: 'detail', activityId: selectedActivity.id, source: screen.source || 'home' })}
        onSave={(draft) => updateActivity(selectedActivity.id, draft)}
      />
    );
  }

  if (screen.name === 'addPurchase' && selectedActivity) {
    return (
      <AddPurchasePage
        mode="create"
        activity={selectedActivity}
        prefill={purchasePrefill}
        onBack={() => setScreen({ name: 'detail', activityId: selectedActivity.id, source: screen.source || 'home' })}
        onSave={(draft) => savePurchase(selectedActivity.id, draft)}
      />
    );
  }

  if (screen.name === 'editPurchase' && selectedActivity && selectedPurchase) {
    return (
      <AddPurchasePage
        mode="edit"
        activity={selectedActivity}
        purchase={selectedPurchase}
        onBack={() => setScreen({ name: 'detail', activityId: selectedActivity.id, source: screen.source || 'home' })}
        onSave={(draft) => updatePurchase(selectedActivity.id, selectedPurchase.id, draft)}
        onDelete={() => deletePurchase(selectedActivity.id, selectedPurchase.id)}
      />
    );
  }

  if (screen.name === 'addAsset') {
    return <AssetForm mode="create" onBack={() => { setActiveTab('assets'); setScreen({ name: 'tab' }); }} onSave={saveAsset} />;
  }

  if (screen.name === 'editAsset' && selectedAsset) {
    return (
      <AssetForm
        mode="edit"
        asset={selectedAsset}
        onBack={() => { setActiveTab('assets'); setScreen({ name: 'tab' }); }}
        onSave={(draft) => updateAsset(selectedAsset.id, { ...draft, source: selectedAsset.source, sourceActivityId: selectedAsset.sourceActivityId, sourcePurchaseId: selectedAsset.sourcePurchaseId })}
        onDelete={() => deleteAsset(selectedAsset)}
      />
    );
  }

  if (screen.name === 'detail' && selectedActivity) {
    return (
      <ActivityDetailPage
        activity={selectedActivity}
        onBack={() => {
          setActiveTab(screen.source === 'activities' ? 'activities' : 'home');
          setScreen({ name: 'tab' });
        }}
        onEdit={() => setScreen({ name: 'edit', activityId: selectedActivity.id, source: screen.source || 'home' })}
        onDeleteActivity={() => deleteActivity(selectedActivity.id)}
        onAddPurchase={(prefill = {}) => {
          setPurchasePrefill(typeof prefill === 'string' ? { category: prefill } : prefill);
          setScreen({ name: 'addPurchase', activityId: selectedActivity.id, source: screen.source || 'home' });
        }}
        onEditPurchase={(purchaseId) => setScreen({ name: 'editPurchase', activityId: selectedActivity.id, purchaseId, source: screen.source || 'home' })}
      />
    );
  }

  if (activities.length === 0) {
    return (
      <PhoneCanvas bottomAction={<BottomTabs activeTab={activeTab} onChange={setActiveTab} />}>
        {activeTab === 'home' && <EmptyHome selectedMonth={homeMonth} onMonthSelect={setHomeMonth} onCreate={() => setScreen({ name: 'create' })} onOpenActivities={() => setActiveTab('activities')} />}
        {activeTab === 'activities' && <ActivitiesTab activities={activities} onOpenActivity={(id) => openDetail(id, 'activities')} />}
        {activeTab === 'assets' && <AssetsTab assets={assets} onAddAsset={() => setScreen({ name: 'addAsset' })} onEditAsset={(assetId) => setScreen({ name: 'editAsset', assetId })} />}
      </PhoneCanvas>
    );
  }

  return (
    <PhoneCanvas bottomAction={<BottomTabs activeTab={activeTab} onChange={setActiveTab} />}>
      {activeTab === 'home' && <HomeDashboard activities={activities} assets={assets} selectedMonth={homeMonth} onMonthSelect={setHomeMonth} onCreate={() => setScreen({ name: 'create' })} onOpenActivity={(id) => openDetail(id, 'home')} onOpenActivities={() => setActiveTab('activities')} onOpenAssets={() => setActiveTab('assets')} />}
      {activeTab === 'activities' && <ActivitiesTab activities={activities} onOpenActivity={(id) => openDetail(id, 'activities')} />}
      {activeTab === 'assets' && <AssetsTab assets={assets} onAddAsset={() => setScreen({ name: 'addAsset' })} onEditAsset={(assetId) => setScreen({ name: 'editAsset', assetId })} />}
    </PhoneCanvas>
  );
}

function loadActivities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw).map((activity) => ({
        ...activity,
        type: normalizeActivityType(activity.type),
        purchases: activity.purchases || [],
      }));
    }

    const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldRaw) return [];
    const old = JSON.parse(oldRaw);
    return [
      {
        id: old.id || Date.now().toString(),
        name: old.name || '',
        date: old.date || '',
        peopleCount: old.peopleCount || old.people || 0,
        unitPrice: old.unitPrice || old.price || 0,
        expectedIncome: old.expectedIncome || old.income || 0,
        type: normalizeActivityType(old.type),
        status: old.status || 'preparing',
        purchases: old.purchases || [],
        createdAt: old.createdAt || new Date().toISOString(),
        updatedAt: old.updatedAt || new Date().toISOString(),
      },
    ];
  } catch {
    return [];
  }
}

function loadManualAssets() {
  try {
    const raw = localStorage.getItem(MANUAL_ASSETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((asset) => ({
      ...asset,
      id: asset.id?.startsWith('manual-') ? asset.id : `manual-${asset.id || Date.now()}`,
      source: 'manual',
      value: Number(asset.value ?? asset.amount) || 0,
      quantity: Number(asset.quantity) || 1,
      category: normalizeAssetCategory(asset.category),
      reuseCount: asset.reuseCount || 0,
      lastUsedAt: asset.lastUsedAt || '',
    }));
  } catch {
    return [];
  }
}

function money(value) {
  return `¥${Math.round(Number(value) || 0).toLocaleString('zh-CN')}`;
}

function activityCost(activity) {
  return activity.purchases.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function activityProfit(activity) {
  return (Number(activity.expectedIncome) || 0) - activityCost(activity);
}

function normalizeActivityType(type) {
  if (!type) return defaultActivityType;
  const matched = activityTypes.find((item) => item.id === type.id);
  if (matched && !type.name && !type.label) return matched;
  return {
    id: type.id || 'other',
    name: type.name || type.label || matched?.name || '其他',
    icon: type.icon || matched?.icon || '📦',
  };
}

function getAssets(activities) {
  return activities.flatMap((activity) =>
    activity.purchases
      .filter((purchase) => purchase.isReusable)
      .map((purchase) => ({
        id: `${activity.id}-${purchase.id}`,
        sourcePurchaseId: purchase.id,
        sourceActivityId: activity.id,
        sourceActivityName: activity.name,
        name: purchase.name,
        amount: purchase.amount,
        value: Number(purchase.amount) || 0,
        quantity: Number(purchase.assetQuantity) || 1,
        category: normalizeAssetCategory(purchase.category),
        source: 'purchase',
        reuseCount: purchase.reuseCount || 0,
        lastUsedAt: purchase.lastUsedAt || purchase.createdAt,
        note: purchase.note,
        createdAt: purchase.createdAt,
      })),
  );
}

function getMonthlySummary(activities, selectedMonth = new Date()) {
  const monthlyActivities = activities.filter((activity) => {
    const date = parseDateValue(activity.date);
    return date && date.getFullYear() === selectedMonth.getFullYear() && date.getMonth() === selectedMonth.getMonth();
  });
  const income = monthlyActivities.reduce((sum, activity) => sum + (Number(activity.expectedIncome) || 0), 0);
  const cost = activities.reduce((sum, activity) => {
    const monthlyCost = activity.purchases.reduce((purchaseSum, purchase) => {
      const purchaseDate = parseDateValue((purchase.createdAt || activity.date || '').slice(0, 10));
      if (!purchaseDate || purchaseDate.getFullYear() !== selectedMonth.getFullYear() || purchaseDate.getMonth() !== selectedMonth.getMonth()) {
        return purchaseSum;
      }
      return purchaseSum + (Number(purchase.amount) || 0);
    }, 0);
    return sum + monthlyCost;
  }, 0);
  const profit = income - cost;
  const margin = income > 0 ? `${((profit / income) * 100).toFixed(1)}%` : '0%';
  return { income, cost, profit, margin, activityCount: monthlyActivities.length };
}

function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function isActivityPast(activity) {
  const date = parseDateValue(activity.date);
  if (!date) return false;
  const today = new Date();
  const activityDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return activityDay < todayDay;
}

function getActivityStatus(activity) {
  if (activity.status === 'done' || isActivityPast(activity)) {
    return { label: '已完成', className: 'bg-slate-100 text-slate-500' };
  }
  if (activity.status === 'active') {
    return { label: '进行中', className: 'bg-blue-50 text-blue-600' };
  }
  return { label: '筹备中', className: 'bg-emerald-50 text-emerald-600' };
}

function sortActivities(activities, sortBy) {
  return [...activities].sort((a, b) => {
    if (sortBy === 'created_desc') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'profit_desc') {
      return activityProfit(b) - activityProfit(a);
    }
    if (sortBy === 'cost_desc') {
      return activityCost(b) - activityCost(a);
    }
    return new Date(b.date || 0) - new Date(a.date || 0);
  });
}

function assetIcon(category) {
  const icons = {
    酒水: '🍷',
    食物: '🍗',
    交通: '🚕',
    布置: '🎈',
    露营装备: '⛺',
    灯光音响: '💡',
    桌椅道具: '🪑',
    装饰布置: '🎈',
    餐具用品: '🍽️',
    拍摄设备: '📷',
    其他: '📦',
  };
  return icons[category] || '📦';
}

function normalizeAssetCategory(category) {
  if (assetCategories.includes(category)) return category;
  const mapped = {
    布置: '装饰布置',
    其他: '其他',
  }[category];
  return mapped || '其他';
}

function assetUnitValue(asset) {
  return Number(asset.value ?? asset.amount) || 0;
}

function assetQuantity(asset) {
  return Number(asset.quantity) || 1;
}

function assetTotalValue(asset) {
  return assetUnitValue(asset) * assetQuantity(asset);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function sameDay(a, b) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function buildCalendarDays(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function daysUntilActivity(dateValue) {
  const startDate = parseDateValue(dateValue);
  if (!startDate) return null;
  const today = new Date();
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.ceil((start - current) / 86400000));
}

function PhoneCanvas({ children, bottomAction }) {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#080d2b]">
      <div
        className="relative mx-auto min-h-screen w-full max-w-[390px] overflow-hidden bg-[#F7F8FA] pb-[calc(8rem+env(safe-area-inset-bottom))] shadow-[0_24px_80px_rgba(91,110,148,0.16)]"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))',
        }}
      >
        {children}
        {bottomAction && <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 px-4">{bottomAction}</div>}
      </div>
    </main>
  );
}

function StatusBar() {
  const [time, setTime] = useState(formatStatusTime);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    const updateTime = () => setTime(formatStatusTime());
    updateTime();
    const timer = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let batteryManager;
    let cancelled = false;
    let updateBattery;

    async function readBattery() {
      if (!navigator.getBattery) return;
      batteryManager = await navigator.getBattery();
      updateBattery = () => {
        if (cancelled) return;
        setBattery({
          charging: batteryManager.charging,
          level: Math.round(batteryManager.level * 100),
        });
      };
      updateBattery();
      batteryManager.addEventListener('levelchange', updateBattery);
      batteryManager.addEventListener('chargingchange', updateBattery);
    }

    readBattery().catch(() => setBattery(null));
    return () => {
      cancelled = true;
      if (!batteryManager || !updateBattery) return;
      batteryManager.removeEventListener('levelchange', updateBattery);
      batteryManager.removeEventListener('chargingchange', updateBattery);
    };
  }, []);

  return (
    <div className="flex h-12 items-center justify-between px-[31px] pt-2 text-[15px] font-bold text-black">
      <span>{time}</span>
      <div className={`flex items-center gap-1.5 ${online ? 'text-black' : 'text-[#9aa1b3]'}`}>
        <SignalIcon />
        <Wifi size={16} strokeWidth={3} />
        <BatteryIndicator battery={battery} />
      </div>
    </div>
  );
}

function formatStatusTime(date = new Date()) {
  return date.toLocaleTimeString('zh-CN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

function BatteryIndicator({ battery }) {
  if (!battery) {
    return <Battery size={24} strokeWidth={2.2} aria-label="电池状态" />;
  }

  return (
    <div className="flex items-center gap-0.5" aria-label={`电量 ${battery.level}%${battery.charging ? '，正在充电' : ''}`}>
      <div className="relative h-[12px] w-[24px] rounded-[4px] border-[1.8px] border-current px-[1.5px] py-[1.5px]">
        <span
          className={`block h-full rounded-[2px] ${battery.level <= 20 && !battery.charging ? 'bg-orange-500' : 'bg-current'}`}
          style={{ width: `${Math.max(8, battery.level)}%` }}
        />
      </div>
      <span className="h-[5px] w-[2px] rounded-r-full bg-current" />
      {battery.charging && <span className="-ml-0.5 text-[9px] leading-none">⚡</span>}
    </div>
  );
}

function SignalIcon() {
  return (
    <div className="flex h-4 items-end gap-[2px]" aria-label="信号">
      {[6, 9, 12, 15].map((height) => (
        <span key={height} className="w-[3px] rounded-full bg-black" style={{ height }} />
      ))}
    </div>
  );
}

function EmptyHome({ selectedMonth, onMonthSelect, onCreate, onOpenActivities }) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const summary = getMonthlySummary([], selectedMonth);

  return (
    <>
      <section className="px-7 pt-8">
        <h1 className="text-[31px] font-black leading-none text-[#080d2b]">活动经营账本</h1>
      </section>

      <MonthlyOverviewCard
        month={formatMonth(selectedMonth)}
        income={summary.income}
        cost={summary.cost}
        profit={summary.profit}
        onMonthClick={() => setMonthPickerOpen(true)}
      />

      <section className="mt-6">
        <button className="mb-1 flex w-full items-center gap-1 px-9 text-left" onClick={onOpenActivities}>
          <h2 className="text-[20px] font-black tracking-[-0.04em]">进行中的活动</h2>
          <ChevronRight size={17} className="text-[#aeb4c3]" strokeWidth={2.5} />
        </button>

        <div className="flex min-h-[230px] items-center justify-center px-8 pb-8 pt-2 text-center">
          <div>
            <p className="text-[14px] font-semibold text-[#b1acd8]">还没有记录</p>
            <p className="mt-1 text-[14px] font-semibold text-[#b1acd8]">开始创建你的第一场活动吧～</p>
          </div>
        </div>
      </section>
      <FloatingCreateButton onClick={onCreate} />
      {monthPickerOpen && (
        <MonthPickerSheet
          activities={[]}
          selectedMonth={selectedMonth}
          onSelect={(month) => {
            onMonthSelect(month);
            setMonthPickerOpen(false);
          }}
          onCancel={() => setMonthPickerOpen(false)}
        />
      )}
    </>
  );
}

function MonthlyOverviewCard({ month, income, cost, profit, onMonthClick }) {
  const profitTone = profit > 0 ? 'text-[#087A52]' : 'text-[#7F7AA8]';

  return (
    <section className="relative mx-6 mt-6 min-h-[200px] overflow-hidden rounded-[32px] border border-white/80 bg-[radial-gradient(circle_at_12%_12%,rgba(234,248,241,0.95),transparent_36%),radial-gradient(circle_at_88%_76%,rgba(238,240,255,0.95),transparent_42%),linear-gradient(135deg,#F9FFFC_0%,#F7FAFF_50%,#F3F2FF_100%)] px-6 pb-5 pt-5 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
      <div className="pointer-events-none absolute left-8 top-8 h-1.5 w-1.5 rounded-full bg-[#8E8AFB]/35" />
      <div className="pointer-events-none absolute right-28 top-24 h-1 w-1 rounded-full bg-[#087A52]/20" />
      <div className="relative z-10">
        <div className="min-w-0">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/85 bg-white/68 px-[18px] py-2.5 text-[14px] font-black text-[#111827] shadow-[0_10px_24px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.92)] transition active:scale-[0.98]" type="button" onClick={onMonthClick}>
            {month}
            <ChevronDown size={14} className="text-[#9CA3AF]" strokeWidth={2.4} />
          </button>
          <p className="mt-7 text-[15px] font-black tracking-[-0.02em] text-[#7B8497]">本月利润</p>
          <p className={`mt-2 text-[50px] font-black leading-[0.9] tracking-[-0.075em] ${profitTone}`}>{money(profit)}</p>
        </div>
      </div>
      <div className="relative z-10 mt-5 grid h-12 grid-cols-3 items-center rounded-full border border-white/80 bg-white/68 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <span className="text-[12px] font-black text-[#8A93A8]">收入 <span className="text-[14px] text-[#0B123F]">{money(income)}</span></span>
        <span className="border-x border-[rgba(148,163,184,0.22)] text-[12px] font-black text-[#8A93A8]">成本 <span className="text-[14px] text-[#0B123F]">{money(cost)}</span></span>
        <span className="text-[12px] font-black text-[#8A93A8]">利润 <span className="text-[14px] text-[#5B5CF6]">{money(profit)}</span></span>
      </div>
    </section>
  );
}

function MonthPickerSheet({ activities, selectedMonth, onSelect, onCancel }) {
  const [visibleYear, setVisibleYear] = useState(selectedMonth.getFullYear());
  const monthItems = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(visibleYear, index, 1);
    const summary = getMonthlySummary(activities, date);
    const hasData = summary.activityCount > 0 || summary.income !== 0 || summary.cost !== 0 || summary.profit !== 0;
    return {
      date,
      hasData,
      key: `${visibleYear}-${String(index + 1).padStart(2, '0')}`,
      label: `${index + 1}月`,
      profit: summary.profit,
    };
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[rgba(15,23,42,0.16)] px-4 pb-5" onClick={onCancel}>
      <div className="w-full overflow-hidden rounded-[30px] bg-white/92 px-6 pb-7 pt-3 shadow-[0_18px_50px_rgba(35,43,73,0.12)] ring-1 ring-white/70 backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto h-1.5 w-10 rounded-full bg-[#d9deea]" />
        <h2 className="pb-4 pt-4 text-center text-[18px] font-black tracking-[-0.035em] text-[#111827]">选择月份</h2>
        <div className="mb-5 flex h-12 items-center justify-between rounded-full bg-[#F5F6FA] px-1 ring-1 ring-[#edf0f6]">
          <button className="grid h-10 w-10 place-items-center rounded-full text-[#635BFF] transition active:scale-95" onClick={() => setVisibleYear((year) => year - 1)} aria-label="上一年">
            <ChevronLeft size={18} strokeWidth={2.6} />
          </button>
          <span className="text-[15px] font-black text-[#111827]">{visibleYear}年</span>
          <button className="grid h-10 w-10 place-items-center rounded-full text-[#635BFF] transition active:scale-95" onClick={() => setVisibleYear((year) => year + 1)} aria-label="下一年">
            <ChevronRight size={18} strokeWidth={2.6} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {monthItems.map((item) => {
            const selected = selectedMonth.getFullYear() === item.date.getFullYear() && selectedMonth.getMonth() === item.date.getMonth();
            return (
              <button
                key={item.key}
                className={`min-h-[60px] rounded-[19px] border px-3 py-2.5 text-center transition active:scale-[0.98] ${
                  selected
                    ? 'border-[#B9B8FF] bg-[#EEF0FF] text-[#635BFF] shadow-[0_8px_20px_rgba(99,91,255,0.08)]'
                    : 'border-transparent bg-[#F7F8FA]/70 text-[#6B7280]'
                }`}
                onClick={() => onSelect(item.date)}
              >
                <span className="block text-[15px] font-semibold">{item.label}</span>
                {item.hasData && <span className="mt-1 block text-[12px] font-semibold text-[#635BFF]">利润 {money(item.profit)}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HomeDashboard({ activities, assets, selectedMonth, onMonthSelect, onCreate, onOpenActivity, onOpenActivities, onOpenAssets }) {
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const summary = getMonthlySummary(activities, selectedMonth);
  const activeActivities = activities.filter((activity) => ['preparing', 'active'].includes(activity.status) && !isActivityPast(activity));

  return (
    <>
      <section className="px-7 pt-8">
        <h1 className="text-[31px] font-black leading-none text-[#080d2b]">活动经营账本</h1>
      </section>

      <MonthlyOverviewCard
        month={formatMonth(selectedMonth)}
        income={summary.income}
        cost={summary.cost}
        profit={summary.profit}
        onMonthClick={() => setMonthPickerOpen(true)}
      />

      <section className="mt-6">
        <button className="mb-1 flex w-full items-center gap-1 px-9 text-left" onClick={onOpenActivities}>
          <h2 className="text-[20px] font-black tracking-[-0.04em]">进行中的活动</h2>
          <ChevronRight size={17} className="text-[#aeb4c3]" strokeWidth={2.5} />
        </button>
        {activeActivities.length > 0 ? (
          <div className="space-y-3 px-5">
            {activeActivities.map((activity) => (
              <ActivityBusinessCard key={activity.id} activity={activity} onClick={() => onOpenActivity(activity.id)} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center px-8 pb-8 pt-2 text-center">
            <div>
              <p className="text-[14px] font-semibold text-[#b1acd8]">还没有记录</p>
              <p className="mt-1 text-[14px] font-semibold text-[#b1acd8]">开始创建你的第一场活动吧～</p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 pb-3">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-[20px] font-black tracking-[-0.04em]">可复用资产</h2>
        </div>
        {assets.length ? (
          <button className="relative mx-5 block w-[calc(100%-40px)] overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_60%,#f4fff9_100%)] p-5 text-left shadow-[0_18px_46px_rgba(82,98,135,0.13)] ring-1 ring-white/70 backdrop-blur-2xl transition active:scale-[0.99]" onClick={onOpenAssets}>
            <ChevronRight size={16} className="absolute right-5 top-5 text-[#b1b7c6]" />
            <div className="grid grid-cols-3 gap-2">
              {assets.slice(0, 3).map((asset) => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </div>
          </button>
        ) : (
          <div className="flex min-h-[96px] items-center justify-center px-8 text-center">
            <p className="text-[14px] font-semibold text-[#b1acd8]">暂无可复用资产</p>
          </div>
        )}
      </section>

      <FloatingCreateButton onClick={onCreate} />
      {monthPickerOpen && (
        <MonthPickerSheet
          activities={activities}
          selectedMonth={selectedMonth}
          onSelect={(month) => {
            onMonthSelect(month);
            setMonthPickerOpen(false);
          }}
          onCancel={() => setMonthPickerOpen(false)}
        />
      )}
    </>
  );
}

function ActivitiesTab({ activities, onOpenActivity }) {
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const matchesType = (activity) => typeFilter === 'all' || normalizeActivityType(activity.type).id === typeFilter;
  const matchesSearch = (activity) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const activityType = normalizeActivityType(activity.type);
    return `${activity.name} ${activityType.name}`.toLowerCase().includes(query);
  };
  const filters = [
    { id: 'all', label: '全部' },
    { id: 'active', label: '进行中' },
    { id: 'done', label: '已完成' },
  ];
  const typeFilters = [{ id: 'all', name: '全部类型', icon: '' }, ...activityTypes];
  const sortedActivities = sortActivities(activities.filter((activity) => matchesType(activity) && matchesSearch(activity)), sortBy);
  const activeActivities = sortedActivities.filter((activity) => ['preparing', 'active'].includes(activity.status) && !isActivityPast(activity));
  const completedActivities = sortedActivities.filter((activity) => activity.status === 'done' || isActivityPast(activity));
  const filteredAllActivities = sortedActivities;
  const hasActiveFilters = filter !== 'all' || sortBy !== 'date_desc';

  function renderGroup(title, items) {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-[14px] font-black text-[#747b91]">{title}</h2>
        {items.map((activity) => <ActivityListCard key={`${title}-${activity.id}`} activity={activity} onClick={() => onOpenActivity(activity.id)} />)}
      </section>
    );
  }

  return (
    <>
      <section className="px-5 pb-4 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[31px] font-black leading-none tracking-[-0.05em]">活动</h1>
          <div className="flex items-center gap-2">
            <button className={`grid h-10 w-10 place-items-center rounded-full text-[#5b5df7] shadow-[0_8px_22px_rgba(82,98,135,0.08)] transition active:scale-[0.98] ${searchOpen ? 'bg-[#eef2ff]' : 'bg-white/86'}`} onClick={() => setSearchOpen((current) => !current)} aria-label="搜索活动">
              <Search size={18} strokeWidth={2.5} />
            </button>
            <button className={`relative grid h-10 w-10 place-items-center rounded-full text-[#5b5df7] shadow-[0_8px_22px_rgba(82,98,135,0.08)] transition active:scale-[0.98] ${hasActiveFilters ? 'bg-[#eef2ff]' : 'bg-white/86'}`} onClick={() => setFilterSheetOpen(true)} aria-label="筛选活动">
              <SlidersHorizontal size={18} strokeWidth={2.5} />
              {hasActiveFilters && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#5b5df7]" />}
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="mt-4 flex h-11 items-center gap-2 rounded-[18px] bg-white/86 px-3 shadow-[0_8px_22px_rgba(82,98,135,0.08)] ring-1 ring-white/70">
            <Search size={16} className="shrink-0 text-[#9aa1b3]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#151a38] outline-none placeholder:text-[#b7bdcb]"
              value={searchQuery}
              placeholder="搜索活动名称或类型"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && <button className="text-[12px] font-black text-[#858da0]" onClick={() => setSearchQuery('')}>清除</button>}
          </div>
        )}
      </section>
      <section className="scrollbar-none -mx-1 mb-4 flex gap-2 overflow-x-auto px-6 py-1.5">
        {typeFilters.map((type) => {
          const selected = typeFilter === type.id;
          return (
            <button
              key={type.id}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-1 ring-[#7375ff]/25' : 'bg-white/72 text-[#747b91] ring-1 ring-white/70'}`}
              onClick={() => setTypeFilter(type.id)}
            >
              {type.icon ? `${type.icon} ` : ''}{type.name}
            </button>
          );
        })}
      </section>
      <section className="space-y-5 px-5">
        {filter === 'all' && (
          <>
            {filteredAllActivities.length === 0 ? (
              <ActivityEmptyState title="暂无活动" description="创建新活动后，会在这里查看经营记录" />
            ) : (
              <>
                {renderGroup('进行中', activeActivities)}
                {renderGroup('已完成', completedActivities)}
              </>
            )}
          </>
        )}
        {filter === 'active' && (
          activeActivities.length ? activeActivities.map((activity) => <ActivityListCard key={activity.id} activity={activity} onClick={() => onOpenActivity(activity.id)} />) : (
            <ActivityEmptyState title="暂无进行中的活动" description="创建新活动后，会在这里继续跟进采购和利润" />
          )
        )}
        {filter === 'done' && (
          completedActivities.length ? completedActivities.map((activity) => <ActivityListCard key={activity.id} activity={activity} onClick={() => onOpenActivity(activity.id)} />) : (
            <ActivityEmptyState title="暂无已完成活动" description="活动日期结束后，会自动归入已完成" />
          )
        )}
      </section>
      {filterSheetOpen && (
        <ActivityFilterSheet
          filters={filters}
          filter={filter}
          sortBy={sortBy}
          onApply={({ filter: nextFilter, sortBy: nextSortBy }) => {
            setFilter(nextFilter);
            setSortBy(nextSortBy);
            setFilterSheetOpen(false);
          }}
          onReset={() => {
            setFilter('all');
            setSortBy('date_desc');
            setFilterSheetOpen(false);
          }}
          onCancel={() => setFilterSheetOpen(false)}
        />
      )}
    </>
  );
}

function ActivityFilterSheet({ filters, filter, sortBy, onApply, onReset, onCancel }) {
  const [draftFilter, setDraftFilter] = useState(filter);
  const [draftSortBy, setDraftSortBy] = useState(sortBy);
  const sortOptions = [
    { id: 'date_desc', label: '最近活动' },
    { id: 'created_desc', label: '最近创建' },
    { id: 'profit_desc', label: '利润最高' },
    { id: 'cost_desc', label: '成本最高' },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[rgba(15,23,42,0.18)] px-4 pb-5" onClick={onCancel}>
      <div className="max-h-[82vh] w-full overflow-hidden rounded-[30px] bg-white shadow-[0_24px_70px_rgba(35,43,73,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-3 h-[5px] w-10 rounded-full bg-[#d9deea]" />
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#151a38]">筛选活动</h2>
          <button className="text-[13px] font-black text-[#858da0]" onClick={onReset}>重置</button>
        </div>
        <div className="max-h-[58vh] space-y-5 overflow-y-auto px-5 pb-4">
          <FilterOptionGroup title="状态" options={filters} value={draftFilter} onChange={setDraftFilter} />
          <FilterOptionGroup title="排序" options={sortOptions} value={draftSortBy} onChange={setDraftSortBy} />
        </div>
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-3 border-t border-[#eef1f6] p-4">
          <button className="h-12 rounded-full bg-[#f4f6fb] text-[15px] font-black text-[#747b91]" onClick={onCancel}>取消</button>
          <button className="h-12 rounded-full bg-[#5b5df7] text-[15px] font-black text-white shadow-[0_10px_24px_rgba(91,93,247,0.18)]" onClick={() => onApply({ filter: draftFilter, sortBy: draftSortBy })}>应用筛选</button>
        </div>
      </div>
    </div>
  );
}

function FilterOptionGroup({ title, options, value, onChange }) {
  return (
    <section>
      <p className="mb-2 text-[13px] font-black text-[#747b91]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              className={`rounded-full px-3.5 py-2 text-[13px] font-black transition active:scale-[0.98] ${selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-1 ring-[#7375ff]/25' : 'bg-[#f5f7fb] text-[#747b91]'}`}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AssetsTab({ assets, onAddAsset, onEditAsset }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const assetValue = assets.reduce((sum, asset) => sum + assetTotalValue(asset), 0);
  const assetCount = assets.reduce((sum, asset) => sum + assetQuantity(asset), 0);
  const reuseCount = assets.reduce((sum, asset) => sum + (Number(asset.reuseCount) || 0), 0);
  const categoryFilters = ['全部', ...assetCategories];
  const visibleAssets = categoryFilter === 'all' ? assets : assets.filter((asset) => asset.category === categoryFilter);

  return (
    <>
      <SimpleTitle title="资产库" />
      <section className="mx-5 rounded-[30px] bg-white/88 p-5 shadow-[0_18px_44px_rgba(82,98,135,0.14)] backdrop-blur-2xl">
        <p className="text-[13px] font-bold text-[#747b91]">资产总价值</p>
        <p className="mt-2 text-[40px] font-black leading-none tracking-[-0.06em] text-[#151a38]">{money(assetValue)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <SummaryPill label="可复用物资" value={`${assetCount}件`} />
          <SummaryPill label="累计复用" value={`${reuseCount}次`} />
        </div>
      </section>
      <section className="mx-5 mt-6">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#151a38]">可复用物资</h2>
      </section>
      {assets.length === 0 ? (
        <section className="mx-5 mt-8 px-3 text-center">
          <div className="mx-auto flex h-16 w-32 items-center justify-center gap-2 rounded-[24px] bg-white/66 shadow-[0_10px_28px_rgba(82,98,135,0.08)]">
            <span className="text-[26px]">📦</span>
            <span className="text-[26px]">⛺</span>
            <span className="text-[26px]">💡</span>
          </div>
          <h2 className="mt-5 text-[21px] font-black tracking-[-0.045em]">还没有可复用物资</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-6 text-[#747b91]">你可以在采购时标记“可复用”，也可以手动添加已有物资。</p>
          <button className="mt-5 h-10 rounded-full bg-[#eef2ff] px-5 text-[14px] font-black text-[#5b5df7] shadow-[0_8px_18px_rgba(91,93,247,0.08)]" onClick={onAddAsset}>
            新增资产
          </button>
        </section>
      ) : (
        <>
          <section className="scrollbar-none -mx-1 mt-3 flex gap-2 overflow-x-auto px-6 py-1.5">
            {categoryFilters.map((category) => {
              const id = category === '全部' ? 'all' : category;
              const selected = categoryFilter === id;
              return (
                <button
                  key={id}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] font-black transition ${selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-1 ring-[#7375ff]/25' : 'bg-white/72 text-[#747b91] ring-1 ring-white/70'}`}
                  onClick={() => setCategoryFilter(id)}
                >
                  {category}
                </button>
              );
            })}
          </section>
          <section className="mx-5 mt-3 space-y-5">
            {categoryFilter === 'all'
              ? assetCategories.map((category) => {
                  const groupAssets = assets.filter((asset) => asset.category === category);
                  if (groupAssets.length === 0) return null;
                  return <AssetGroup key={category} title={category} assets={groupAssets} onEditAsset={onEditAsset} />;
                })
              : (
                visibleAssets.length ? (
                  <div className="space-y-3">
                    {visibleAssets.map((asset) => <AssetDetailRow key={asset.id} asset={asset} onClick={() => onEditAsset(asset.id)} />)}
                  </div>
                ) : (
                  <div className="rounded-[26px] bg-white/74 p-6 text-center shadow-[0_10px_28px_rgba(82,98,135,0.08)]">
                    <p className="text-[17px] font-black text-[#151a38]">这个分类还没有资产</p>
                    <p className="mt-2 text-[13px] font-semibold text-[#747b91]">可以手动新增已有物资。</p>
                  </div>
                )
              )}
          </section>
        </>
      )}
      <FloatingCreateButton onClick={onAddAsset} />
    </>
  );
}

function AssetGroup({ title, assets, onEditAsset }) {
  return (
    <section>
      <h3 className="mb-2 text-[14px] font-black text-[#747b91]">{title}</h3>
      <div className="space-y-3">
        {assets.map((asset) => <AssetDetailRow key={asset.id} asset={asset} onClick={() => onEditAsset(asset.id)} />)}
      </div>
    </section>
  );
}

function ActivityForm({ mode, activity, onBack, onSave }) {
  const initialDraft = {
    type: activity ? normalizeActivityType(activity.type) : null,
    customTypeName: activity?.type?.id === 'other' && activity?.type?.name !== '其他' ? activity.type.name : '',
    name: activity?.name || '',
    date: activity?.date || '',
    peopleCount: activity?.peopleCount ? String(activity.peopleCount) : '',
    unitPrice: activity?.unitPrice ? String(activity.unitPrice) : '',
    expectedIncome: activity?.expectedIncome ? String(activity.expectedIncome) : '',
  };
  const [draft, setDraft] = useState(initialDraft);
  const [manualIncome, setManualIncome] = useState(Boolean(activity?.expectedIncome));
  const [showConfirm, setShowConfirm] = useState(false);
  const [typeError, setTypeError] = useState('');
  const computedIncome = (Number(draft.peopleCount) || 0) * (Number(draft.unitPrice) || 0);
  const isDirty = Object.keys(draft).some((key) => draft[key] !== initialDraft[key]);
  const canSubmit = draft.name.trim() && draft.date && draft.peopleCount && draft.unitPrice && draft.expectedIncome;

  useEffect(() => {
    if (!manualIncome) setDraft((current) => ({ ...current, expectedIncome: computedIncome ? String(computedIncome) : '' }));
  }, [computedIncome, manualIncome]);

  function handleBack() {
    if (isDirty) {
      setShowConfirm(true);
      return;
    }
    onBack();
  }

  function discard() {
    setDraft(initialDraft);
    setShowConfirm(false);
    onBack();
  }

  function saveActivity() {
    if (!draft.type) {
      setTypeError('请选择活动类型');
      return;
    }
    if (draft.type.id === 'other' && !draft.customTypeName.trim()) {
      setTypeError('请输入自定义活动类型');
      return;
    }
    setTypeError('');
    const type = draft.type.id === 'other'
      ? { id: 'other', name: draft.customTypeName.trim(), icon: draft.type.icon }
      : draft.type;
    onSave({ ...draft, type });
  }

  return (
    <PhoneCanvas bottomAction={<PrimaryButton disabled={!canSubmit} onClick={saveActivity}>{mode === 'create' ? '创建活动' : '保存修改'}</PrimaryButton>}>
      <PageHeader title={mode === 'create' ? '创建活动' : '编辑活动'} onBack={handleBack} compact />
      <section className="mx-5 rounded-[30px] bg-white/86 p-5 shadow-[0_18px_44px_rgba(82,98,135,0.12)] backdrop-blur-2xl">
        <p className="text-[13px] font-bold text-[#747b91]">预计总收入</p>
        <p className="mt-2 text-[40px] font-black leading-none tracking-[-0.06em] text-[#080d2b]">{money(draft.expectedIncome)}</p>
        <p className="mt-3 text-[13px] font-semibold text-[#39bf6c]">{draft.peopleCount || 0} 人 × {money(draft.unitPrice)}</p>
      </section>
      <form className="mx-5 mt-5 space-y-4">
        <ActivityTypePicker
          value={draft.type}
          customValue={draft.customTypeName}
          error={typeError}
          onChange={(type) => {
            setTypeError('');
            setDraft({ ...draft, type, customTypeName: type.id === 'other' ? draft.customTypeName : '' });
          }}
          onCustomChange={(customTypeName) => {
            setTypeError('');
            setDraft({ ...draft, customTypeName, type: { id: 'other', name: customTypeName.trim() || '其他', icon: '📦' } });
          }}
        />
        <TextField label="活动名称" placeholder="共青森林露营" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <DateField label="活动日期" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="活动人数" type="number" placeholder="13" value={draft.peopleCount} onChange={(peopleCount) => setDraft({ ...draft, peopleCount })} />
          <TextField label="活动单价" type="number" placeholder="188" value={draft.unitPrice} onChange={(unitPrice) => setDraft({ ...draft, unitPrice })} />
        </div>
        <TextField
          label="预计总收入"
          type="number"
          placeholder="2444"
          value={draft.expectedIncome}
          onChange={(expectedIncome) => {
            setManualIncome(true);
            setDraft({ ...draft, expectedIncome });
          }}
        />
      </form>
      {showConfirm && (
        <ConfirmDialog
          title={mode === 'create' ? '放弃创建活动？' : '放弃修改？'}
          description={mode === 'create' ? '当前填写的内容还没有保存，返回后将不会创建这场活动。' : '当前修改还没有保存，返回后将不会更新活动信息。'}
          primary="继续编辑"
          secondary={mode === 'create' ? '放弃创建' : '放弃修改'}
          onPrimary={() => setShowConfirm(false)}
          onSecondary={discard}
        />
      )}
    </PhoneCanvas>
  );
}

function AssetForm({ mode = 'create', asset, onBack, onSave, onDelete }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: asset?.name || '',
    category: asset?.category && assetCategories.includes(asset.category) ? asset.category : '',
    value: asset?.value || asset?.amount ? String(asset.value ?? asset.amount) : '',
    quantity: asset?.quantity ? String(asset.quantity) : '1',
    note: asset?.note || '',
  });
  const canSave = draft.name.trim() && draft.category;
  const pageTitle = mode === 'edit' ? '编辑资产' : '新增资产';

  return (
    <PhoneCanvas bottomAction={<PrimaryButton disabled={!canSave} onClick={() => onSave(draft)}>{mode === 'edit' ? '保存修改' : '保存资产'}</PrimaryButton>}>
      <PageHeader title={pageTitle} onBack={onBack} />
      <form className="mx-5 space-y-5">
        <section>
          <h2 className="mb-3 px-1 text-[17px] font-black tracking-[-0.035em] text-[#151a38]">基础信息</h2>
          <div className="rounded-[28px] bg-white/86 p-4 shadow-[0_14px_34px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl">
            <div className="space-y-4">
          <TextField label="资产名称" placeholder="天幕、营地灯、折叠椅、音响" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <AssetCategoryRow value={draft.category} onClick={() => setCategoryPickerOpen(true)} />
          <TextField label="资产价值（可选）" type="number" placeholder="399" value={draft.value} onChange={(value) => setDraft({ ...draft, value })} />
          <TextField label="数量" type="number" placeholder="1" value={draft.quantity} onChange={(quantity) => setDraft({ ...draft, quantity })} />
            </div>
          </div>
        </section>
        <section>
          <h2 className="mb-3 px-1 text-[17px] font-black tracking-[-0.035em] text-[#151a38]">补充信息</h2>
          <div className="rounded-[28px] bg-white/86 p-4 shadow-[0_14px_34px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl">
          <TextArea label="备注" placeholder="放在家里储物柜，下次露营可带。" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />
          {mode === 'edit' && (
            <p className="mt-3 text-[12px] font-semibold text-[#9aa1b3]">
              来源：{asset?.source === 'purchase' ? '来自采购' : '手动新增'}
            </p>
          )}
          </div>
        </section>
        {mode === 'edit' && (
          <button type="button" className="mx-auto block rounded-full px-4 py-3 text-[14px] font-black text-red-500 transition active:scale-[0.98]" onClick={() => setDeleteOpen(true)}>
            删除资产
          </button>
        )}
      </form>
      {deleteOpen && (
        <ConfirmDialog
          title="删除这个资产？"
          description="删除后，该资产将不再出现在资产库中，历史活动记录不会被删除。"
          primary="删除"
          secondary="取消"
          destructive
          onPrimary={onDelete}
          onSecondary={() => setDeleteOpen(false)}
        />
      )}
      {categoryPickerOpen && (
        <AssetCategoryPickerSheet
          value={draft.category}
          onSelect={(category) => {
            setDraft({ ...draft, category });
            setCategoryPickerOpen(false);
          }}
          onCancel={() => setCategoryPickerOpen(false)}
        />
      )}
    </PhoneCanvas>
  );
}

function ActivityTypePicker({ value, customValue, error, onChange, onCustomChange }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[14px] font-black text-[#151a38]">活动类型</p>
        {error && <span className="text-[12px] font-black text-orange-500">{error}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {activityTypes.map((type) => {
          const selected = value?.id === type.id;
          return (
            <button
              key={type.id}
              type="button"
              className={`min-h-[70px] rounded-[20px] px-2 py-3 text-center shadow-[0_8px_20px_rgba(82,98,135,0.08)] ring-1 transition active:scale-[0.98] ${
                selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-[#7375ff]/35' : 'bg-white/86 text-[#151a38] ring-white/70'
              }`}
              onClick={() => onChange(type)}
            >
              <span className="block text-[23px] leading-none">{type.icon}</span>
              <span className="mt-2 block text-[12px] font-black">{type.name}</span>
            </button>
          );
        })}
      </div>
      {value?.id === 'other' && (
        <label className="mt-3 block">
          <input
            className="h-12 w-full rounded-[18px] border-0 bg-white/86 px-4 text-[15px] font-bold text-[#151a38] shadow-[0_10px_28px_rgba(82,98,135,0.08)] outline-none ring-1 ring-transparent transition placeholder:text-[#b7bdcb] focus:ring-[#7375ff]/35"
            placeholder="输入活动类型，例如读书会"
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
          />
        </label>
      )}
    </section>
  );
}

function ActivityDetailPage({ activity, onBack, onEdit, onDeleteActivity, onAddPurchase, onEditPurchase }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [deleteActivityOpen, setDeleteActivityOpen] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const cost = activityCost(activity);
  const profit = activityProfit(activity);
  const reusableCount = activity.purchases.filter((purchase) => purchase.isReusable).length;
  const unpaidCount = activity.purchases.filter((purchase) => !purchase.isPaid).length;
  const unarrivedCount = activity.purchases.filter((purchase) => !purchase.isArrived).length;
  const nonReusablePurchases = activity.purchases.filter((purchase) => !purchase.isReusable);
  const pendingPurchases = nonReusablePurchases.filter((purchase) => !purchase.isPaid || !purchase.isArrived);
  const completedPurchases = nonReusablePurchases.filter((purchase) => purchase.isPaid && purchase.isArrived);
  const reusablePurchases = activity.purchases.filter((purchase) => purchase.isReusable);
  const daysUntil = daysUntilActivity(activity.date);
  const activityType = normalizeActivityType(activity.type);
  const recommendations = getRecommendedPurchases(activity);

  return (
    <PhoneCanvas>
      <PageHeader title="活动经营" onBack={onBack} action={<IconButton icon={<MoreHorizontal size={20} />} label="更多操作" onClick={() => setActionsOpen(true)} subtle />} compact />

      <section className="relative mx-5 overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,#eff7ff,#f7fbff_48%,#ffffff)] p-5 shadow-[0_18px_44px_rgba(92,117,155,0.13)]">
        <div className="relative z-10 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-[25px] font-black leading-tight tracking-[-0.05em] text-[#080d2b]">{activity.name}</h1>
            <StatusLabel className="bg-emerald-50 text-emerald-600">筹备中</StatusLabel>
          </div>
          <p className="mt-2 text-[13px] font-semibold leading-5 text-[#747b91]">
            {activityType.name} · {activity.date} · {activity.peopleCount}人 · {money(activity.unitPrice)}/人
          </p>
          <p className="mt-6 text-[13px] font-black text-[#747b91]">预计利润</p>
          <p className="mt-2 text-[48px] font-black leading-none tracking-[-0.065em] text-emerald-700">{money(profit)}</p>
          <p className="mt-3 text-[13px] font-semibold leading-5 text-[#747b91]">收入 {money(activity.expectedIncome)} · 成本 {money(cost)}</p>
          {daysUntil !== null && <p className="mt-4 inline-flex rounded-full bg-white/78 px-3 py-1.5 text-[12px] font-black text-[#5b5df7] shadow-sm">距离开始还有 {daysUntil} 天</p>}
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-[26px] bg-white/84 p-4 shadow-[0_12px_30px_rgba(82,98,135,0.09)] backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-black tracking-[-0.03em]">采购进度</h2>
          <button className="text-[13px] font-black text-[#5b5df7]" onClick={() => onAddPurchase()}>添加采购</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <StatusStat label="采购项数" value={`${activity.purchases.length}项`} />
          <StatusStat label="待付款" value={`${unpaidCount}项`} />
          <StatusStat label="待到货" value={`${unarrivedCount}项`} />
          <StatusStat label="可复用" value={`${reusableCount}项`} />
        </div>
      </section>

      <section className="mx-5 mt-4 rounded-[28px] bg-white/86 p-4 shadow-[0_14px_34px_rgba(82,98,135,0.1)] backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-black tracking-[-0.03em]">采购明细</h2>
        </div>
        {activity.purchases.length ? (
          <div className="space-y-4">
            <PurchaseGroup title="待处理" purchases={pendingPurchases} onEditPurchase={onEditPurchase} />
            <PurchaseGroup title="已完成" purchases={completedPurchases} onEditPurchase={onEditPurchase} />
            <PurchaseGroup title="可复用物资" purchases={reusablePurchases} onEditPurchase={onEditPurchase} />
          </div>
        ) : (
          <div className="rounded-[24px] bg-[#f6f8fb]/88 px-4 py-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-white/86 text-[28px] shadow-sm">🛒</div>
            <h3 className="mt-3 text-[18px] font-black tracking-[-0.035em] text-[#151a38]">还没开始采购</h3>
            <p className="mx-auto mt-2 max-w-[250px] text-[13px] font-semibold leading-5 text-[#747b91]">记录第一笔采购后，系统会自动扣除成本并更新预计利润。</p>
          </div>
        )}
      </section>

      <RecommendedPurchasesAccordion
        activity={activity}
        activityType={activityType}
        recommendations={recommendations}
        open={recommendationsOpen}
        showAll={showAllRecommendations}
        onToggle={() => setRecommendationsOpen((current) => !current)}
        onShowAll={() => setShowAllRecommendations(true)}
        onAdd={(item) => onAddPurchase(item.prefill)}
      />
      {actionsOpen && (
        <ActionSheet
          title="活动操作"
          actions={[
            { label: '编辑活动信息', onClick: () => { setActionsOpen(false); onEdit(); } },
          ]}
          dangerActions={[
            { label: '删除活动', onClick: () => { setActionsOpen(false); setDeleteActivityOpen(true); } },
          ]}
          onCancel={() => setActionsOpen(false)}
        />
      )}
      {deleteActivityOpen && (
        <ConfirmDialog
          title="删除这场活动？"
          description="删除后，活动信息和采购记录都会被移除。"
          primary="删除"
          secondary="取消"
          destructive
          onPrimary={onDeleteActivity}
          onSecondary={() => setDeleteActivityOpen(false)}
        />
      )}
    </PhoneCanvas>
  );
}

function AddPurchasePage({ mode = 'create', activity, purchase, prefill = {}, onBack, onSave, onDelete }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
  const [reuseInfoOpen, setReuseInfoOpen] = useState(false);
  const source = purchase || prefill;
  const [draft, setDraft] = useState({
    name: source.name || '',
    amount: source.amount ? String(source.amount) : '',
    platform: source.platform || '',
    category: source.category || purchaseCategories[0],
    isPaid: source.isPaid || false,
    isArrived: source.isArrived || false,
    isReusable: source.isReusable || false,
    note: source.note || '',
  });
  const canSave = draft.name.trim() && draft.amount;
  const currentProfit = activityProfit(activity);
  const originalAmount = mode === 'edit' ? Number(purchase?.amount) || 0 : 0;
  const purchaseAmount = Number(draft.amount) || 0;
  const nextProfit = mode === 'edit' ? currentProfit + originalAmount - purchaseAmount : currentProfit - purchaseAmount;
  const pageTitle = mode === 'edit' ? '编辑采购' : '添加采购';

  return (
    <PhoneCanvas bottomAction={<PrimaryButton disabled={!canSave} onClick={() => onSave(draft)}>{mode === 'edit' ? '保存修改' : '保存采购'}</PrimaryButton>}>
      <PageHeader title={pageTitle} onBack={onBack} />
      <section className="mx-5 rounded-[30px] bg-[linear-gradient(145deg,#ffffff_0%,#f7fbff_62%,#f3fff8_100%)] p-5 shadow-[0_18px_44px_rgba(82,98,135,0.13)] ring-1 ring-white/70 backdrop-blur-2xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-black text-[#747b91]">本笔支出</p>
            <p className="mt-2 text-[34px] font-black leading-none tracking-[-0.06em] text-orange-600">{purchaseAmount ? `-${money(purchaseAmount)}` : '-¥0'}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-black text-[#747b91]">预计利润</p>
            <p className="mt-2 text-[16px] font-black text-[#151a38]">
              {purchaseAmount ? `${money(currentProfit)} → ${money(nextProfit)}` : `${money(currentProfit)} → 待输入`}
            </p>
          </div>
        </div>
      </section>

      <form className="mx-5 mt-5 space-y-5">
        <FormSection title="基础信息">
          <TextField label="采购名称" placeholder="例如：饮料、营地灯、打车费" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <TextField label="金额" type="number" placeholder="88" value={draft.amount} onChange={(amount) => setDraft({ ...draft, amount })} />
          <ChipGroup label="类目" options={purchaseCategories} value={draft.category} onChange={(category) => setDraft({ ...draft, category })} />
          <ChannelSelectRow value={draft.platform} onClick={() => setChannelPickerOpen(true)} />
          <RecentChannelChips value={draft.platform} onChange={(platform) => setDraft({ ...draft, platform })} />
        </FormSection>

        {reuseInfoOpen && (
          <>
            <button type="button" className="fixed inset-0 z-[88] cursor-default" aria-label="关闭可复用资产说明" onClick={() => setReuseInfoOpen(false)} />
            <div className="fixed left-1/2 top-[520px] z-[89] w-[238px] -translate-x-[118px] rounded-2xl bg-white/96 px-3.5 py-3 text-[13px] font-semibold leading-5 text-[#5f6678] shadow-[0_16px_36px_rgba(31,45,78,0.16)] ring-1 ring-white/70">
              开启后，这笔采购会自动加入资产库，下次活动可直接复用。
            </div>
          </>
        )}
        <section className="relative rounded-[28px] bg-white/86 p-4 shadow-[0_14px_34px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-[17px] font-black tracking-[-0.035em] text-[#151a38]">可复用物资</h2>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-full bg-[#f2f5fb] text-[#858da0] transition active:scale-[0.96]"
                aria-label="查看可复用资产说明"
                onClick={(event) => {
                  event.stopPropagation();
                  setReuseInfoOpen((current) => !current);
                }}
              >
                <Info size={15} strokeWidth={2.4} />
              </button>
            </div>
            <Switch checked={draft.isReusable} onChange={(isReusable) => setDraft({ ...draft, isReusable })} />
          </div>
        </section>

        <FormSection title="备注" subtle>
          <TextArea label="备注" hideLabel placeholder="尺寸、数量、使用注意事项" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />
        </FormSection>
        {mode === 'edit' && (
          <button type="button" className="mx-auto block rounded-full px-4 py-3 text-[14px] font-black text-red-500 transition active:scale-[0.98]" onClick={() => setDeleteOpen(true)}>
            删除这笔采购
          </button>
        )}
      </form>
      {deleteOpen && (
        <ConfirmDialog
          title="删除这笔采购？"
          description="删除后，该采购金额将从当前成本中移除，利润会重新计算。"
          primary="删除"
          secondary="取消"
          destructive
          onPrimary={onDelete}
          onSecondary={() => setDeleteOpen(false)}
        />
      )}
      {channelPickerOpen && (
        <ChannelPickerSheet
          value={draft.platform}
          onSelect={(platform) => {
            setDraft({ ...draft, platform });
            setChannelPickerOpen(false);
          }}
          onCancel={() => setChannelPickerOpen(false)}
        />
      )}
    </PhoneCanvas>
  );
}

function FormSection({ title, children, subtle = false }) {
  return (
    <section className={`rounded-[28px] p-4 shadow-[0_14px_34px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl ${subtle ? 'bg-white/72' : 'bg-white/86'}`}>
      <h2 className="mb-4 text-[17px] font-black tracking-[-0.035em] text-[#151a38]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ChipGroup({ label, options, value, onChange }) {
  return (
    <section>
      <p className="mb-2 block text-[14px] font-black text-[#151a38]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const selected = value === item;
          return (
            <button
              key={item}
              type="button"
              className={`rounded-full px-3.5 py-2 text-[13px] font-black transition active:scale-[0.98] ${selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-1 ring-[#7375ff]/25' : 'bg-[#f4f6fb] text-[#747b91]'}`}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChannelSelectRow({ value, onClick }) {
  return (
    <section>
      <button
        type="button"
        className="flex h-14 w-full items-center justify-between rounded-[20px] bg-[#f7f9fd] px-4 text-left ring-1 ring-white/80 transition active:scale-[0.99]"
        onClick={onClick}
      >
        <span className="text-[15px] font-black text-[#151a38]">购买渠道</span>
        <span className={`inline-flex items-center gap-1 text-[14px] font-black ${value ? 'text-[#5b5df7]' : 'text-[#a7adbd]'}`}>
          {value || '请选择'} <ChevronRight size={15} strokeWidth={2.6} />
        </span>
      </button>
    </section>
  );
}

function RecentChannelChips({ value, onChange }) {
  return (
    <section>
      <p className="mb-2 text-[12px] font-black text-[#858da0]">最近常用</p>
      <div className="flex flex-wrap gap-2">
        {recentPurchaseChannels.map((channel) => {
          const selected = value === channel;
          return (
            <button
              key={channel}
              type="button"
              className={`rounded-full px-3 py-1.5 text-[12px] font-black transition active:scale-[0.98] ${selected ? 'bg-[#eef2ff] text-[#5b5df7] ring-1 ring-[#7375ff]/25' : 'bg-[#f4f6fb] text-[#747b91]'}`}
              onClick={() => onChange(channel)}
            >
              {channel}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ChannelPickerSheet({ value, onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[rgba(15,23,42,0.18)] px-4 pb-5" onClick={onCancel}>
      <div className="max-h-[78vh] w-full overflow-hidden rounded-[30px] bg-white/96 shadow-[0_24px_70px_rgba(35,43,73,0.18)] ring-1 ring-white/70 backdrop-blur-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-[#d9deea]" />
        <h2 className="px-5 pb-4 pt-4 text-center text-[18px] font-black tracking-[-0.035em] text-[#151a38]">选择购买渠道</h2>
        <div className="max-h-[55vh] overflow-y-auto px-4 pb-3">
          {purchaseChannelGroups.map((group) => (
            <section key={group.title} className="mb-4 last:mb-0">
              <p className="mb-2 px-1 text-[12px] font-black text-[#9aa1b3]">{group.title}</p>
              <div className="overflow-hidden rounded-[22px] bg-[#f6f8fb]">
                {group.options.map((channel) => {
                  const selected = value === channel;
                  return (
                    <button
                      key={`${group.title}-${channel}`}
                      type="button"
                      className="flex h-12 w-full items-center justify-between border-b border-white/80 px-4 text-left last:border-b-0 transition active:bg-[#eef2ff]"
                      onClick={() => onSelect(channel)}
                    >
                      <span className="text-[15px] font-black text-[#151a38]">{channel}</span>
                      {selected && <span className="text-[15px] font-black text-[#5b5df7]">已选</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <button className="m-3 h-12 w-[calc(100%-24px)] rounded-[22px] bg-[#f6f8fb] text-[15px] font-black text-[#747b91]" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function AssetCategoryRow({ value, onClick }) {
  return (
    <section>
      <p className="mb-2 block text-[14px] font-black text-[#151a38]">资产分类</p>
      <button
        type="button"
        className="flex h-14 w-full items-center justify-between rounded-[20px] bg-[#f7f9fd] px-4 text-left ring-1 ring-white/80 transition active:scale-[0.99]"
        onClick={onClick}
      >
        <span className="text-[15px] font-black text-[#151a38]">资产分类</span>
        <span className={`inline-flex items-center gap-1 text-[14px] font-black ${value ? 'text-[#5b5df7]' : 'text-[#a7adbd]'}`}>
          {value || '请选择'} <ChevronRight size={15} strokeWidth={2.6} />
        </span>
      </button>
    </section>
  );
}

function AssetCategoryPickerSheet({ value, onSelect, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[rgba(15,23,42,0.18)] px-4 pb-5" onClick={onCancel}>
      <div className="w-full overflow-hidden rounded-[30px] bg-white shadow-[0_24px_70px_rgba(35,43,73,0.18)]" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-3 h-[5px] w-10 rounded-full bg-[#d9deea]" />
        <h2 className="px-5 pb-4 pt-4 text-center text-[18px] font-black tracking-[-0.035em] text-[#151a38]">选择资产分类</h2>
        <div className="px-4 pb-3">
          <div className="overflow-hidden rounded-[22px] bg-[#f6f8fb]">
            {assetCategories.map((category) => {
              const selected = value === category;
              return (
                <button
                  key={category}
                  type="button"
                  className="flex h-12 w-full items-center justify-between border-b border-white/80 px-4 text-left last:border-b-0 transition active:bg-[#eef2ff]"
                  onClick={() => onSelect(category)}
                >
                  <span className="text-[15px] font-black text-[#151a38]">{category}</span>
                  {selected && <span className="text-[15px] font-black text-[#5b5df7]">已选</span>}
                </button>
              );
            })}
          </div>
        </div>
        <button className="m-3 h-12 w-[calc(100%-24px)] rounded-[22px] bg-[#f6f8fb] text-[15px] font-black text-[#747b91]" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button type="button" className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? 'bg-[#5b5df7]' : 'bg-[#e5e9f1]'}`} onClick={() => onChange(!checked)}>
      <span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

function StatusChip({ active, children, onClick }) {
  return (
    <button type="button" className={`rounded-full px-3.5 py-2 text-[13px] font-black transition active:scale-[0.98] ${active ? 'bg-[#eef2ff] text-[#5b5df7]' : 'bg-[#f4f6fb] text-[#858da0]'}`} onClick={onClick}>
      {children}
    </button>
  );
}

function BottomTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'activities', label: '活动', icon: ListChecks },
    { id: 'assets', label: '资产库', icon: Archive },
  ];

  return (
    <nav className="mx-auto grid h-[76px] w-full max-w-[350px] grid-cols-3 rounded-full border border-white/70 bg-white/42 px-2.5 py-2.5 shadow-[0_16px_36px_rgba(31,41,55,0.09),0_2px_8px_rgba(31,41,55,0.04),inset_0_1px_0_rgba(255,255,255,0.98)] backdrop-blur-[34px] [backdrop-filter:blur(34px)_saturate(2.1)] [-webkit-backdrop-filter:blur(34px)_saturate(2.1)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button key={tab.id} className={`flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ease-out ${selected ? 'bg-white/58 text-[#6D35F4] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_rgba(91,92,246,0.08)] ring-1 ring-white/55 backdrop-blur-[20px]' : 'text-[#111827]/76'}`} onClick={() => onChange(tab.id)}>
            <Icon size={22} strokeWidth={selected ? 2.65 : 2.3} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function FloatingCreateButton({ onClick }) {
  return (
    <button
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+118px)] left-1/2 z-40 grid h-[62px] w-[62px] translate-x-[112px] place-items-center rounded-full bg-[#5b5cf6] text-white shadow-[0_16px_34px_rgba(91,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/30 transition active:scale-[0.96]"
      onClick={onClick}
      aria-label="创建活动"
    >
      <Plus size={31} strokeWidth={2.8} />
    </button>
  );
}

function ActivityBusinessCard({ activity, onClick }) {
  const cost = activityCost(activity);
  const profit = activityProfit(activity);
  const status = getActivityStatus(activity);
  const activityType = normalizeActivityType(activity.type);
  const daysUntil = daysUntilActivity(activity.date);
  const progressLabel = `采购进度 ${activity.purchases.length} / 8 项`;
  const progress = Math.min((activity.purchases.length / 8) * 100, 100);

  return (
    <button className="relative w-full rounded-[30px] border border-white/70 bg-white/90 p-5 text-left shadow-[0_18px_48px_rgba(31,45,78,0.08)] backdrop-blur-2xl transition active:scale-[0.99]" onClick={onClick}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[20px] font-black leading-tight tracking-[-0.04em]">{activity.name}</h3>
          <p className="mt-2 text-[12px] font-semibold text-[#747b91]">{activityType.icon} {activityType.name} · {activity.date} · {activity.peopleCount}人</p>
        </div>
        <StatusLabel className={status.className}>{status.label}</StatusLabel>
      </div>
      <div className="mt-5">
        <p className="text-[12px] font-black text-[#747b91]">预计利润</p>
        <p className={`mt-1 text-[38px] font-black leading-none tracking-[-0.06em] ${profit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>{money(profit)}</p>
        <p className="mt-2 text-[12px] font-semibold text-[#858da0]">收入 {money(activity.expectedIncome)} · 成本 {money(cost)}</p>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-black text-[#5b5df7]">{progressLabel}</p>
          <p className="text-[12px] font-semibold text-[#9aa1b3]">{Math.round(progress)}%</p>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-[#e5e9f1]">
          <div className="h-1.5 rounded-full bg-[#5b5df7]" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#edf1f7] pt-3">
        <p className="text-[12px] font-black text-[#747b91]">{daysUntil !== null ? `距开始 ${daysUntil} 天` : '活动日期待确认'}</p>
        <span className="shrink-0 text-[13px] font-black text-[#5b5df7]">记录采购 &gt;</span>
      </div>
    </button>
  );
}

function ActivityListCard({ activity, onClick }) {
  const cost = activityCost(activity);
  const reusableCount = activity.purchases.filter((purchase) => purchase.isReusable).length;
  const status = getActivityStatus(activity);
  const profit = activityProfit(activity);
  const activityType = normalizeActivityType(activity.type);

  return (
    <button className="w-full rounded-[26px] bg-white/88 p-4 text-left shadow-[0_12px_30px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[18px] font-black tracking-[-0.035em]">{activity.name}</h3>
          <p className="mt-2 text-[12px] font-semibold text-[#747b91]">{activityType.icon} {activityType.name} · {activity.date} · {activity.purchases.length} 笔采购 · {reusableCount} 件可复用</p>
        </div>
        <StatusLabel className={status.className}>{status.label}</StatusLabel>
      </div>
      <div className="mt-5">
        <p className="text-[12px] font-black text-[#747b91]">利润</p>
        <p className={`mt-1 text-[32px] font-black leading-none tracking-[-0.06em] ${profit >= 0 ? 'text-emerald-700' : 'text-orange-600'}`}>{money(profit)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SummaryPill label="收入" value={money(activity.expectedIncome)} />
        <SummaryPill label="成本" value={money(cost)} />
      </div>
    </button>
  );
}

function ActivityEmptyState({ title, description }) {
  return (
    <div className="rounded-[26px] bg-white/84 p-5 text-center shadow-[0_12px_30px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-[#eef2ff] text-[#5b5df7]">
        <CalendarDays size={24} strokeWidth={2.5} />
      </div>
      <p className="mt-4 text-[17px] font-black tracking-[-0.035em] text-[#151a38]">{title}</p>
      <p className="mx-auto mt-2 max-w-[250px] text-[13px] font-semibold leading-5 text-[#747b91]">{description}</p>
    </div>
  );
}

function getRecommendedPurchases(activity) {
  const type = normalizeActivityType(activity.type);
  const people = Math.max(Number(activity.peopleCount) || 1, 1);
  const activitySignal = `${type.name}${activity.name}`;
  const isHotpot = /火锅|锅/.test(activitySignal);

  if (isHotpot) {
    const foodLow = people * 60;
    const foodHigh = people * 80;
    const drinkLow = people * 20;
    const drinkHigh = people * 30;
    const suppliesHigh = Math.ceil(people * 1.5);

    return [
      makeRecommendation({
        name: '火锅食材',
        suggestion: `建议 ${money(foodLow)}-${money(foodHigh)}`,
        category: '食物',
        description: '肉类、蔬菜、丸滑、主食',
        amount: foodLow,
        estimateLow: foodLow,
        estimateHigh: foodHigh,
        note: `系统根据 ${people} 人火锅局推荐，可按实际金额修改。`,
      }),
      makeRecommendation({
        name: '饮料酒水',
        suggestion: `建议 ${money(drinkLow)}-${money(drinkHigh)}`,
        category: '酒水',
        description: '饮料、啤酒、气泡水',
        amount: drinkLow,
        estimateLow: drinkLow,
        estimateHigh: drinkHigh,
        note: `系统根据 ${people} 人火锅局推荐，可按实际金额修改。`,
      }),
      makeRecommendation({
        name: '一次性用品',
        suggestion: `建议 ${people}-${suppliesHigh}套`,
        category: '其他',
        description: '碗筷、杯子、纸巾、垃圾袋',
        amount: '',
        estimateLow: 0,
        estimateHigh: 0,
        note: `系统根据 ${people} 人活动推荐，按实际数量和金额填写。`,
      }),
      makeRecommendation({
        name: '调料蘸料',
        suggestion: '建议 ¥50-100',
        category: '食物',
        description: '蘸料、锅底、调味品',
        amount: 50,
        estimateLow: 50,
        estimateHigh: 100,
        note: `系统根据 ${people} 人火锅局推荐，可按实际金额修改。`,
      }),
    ];
  }

  const templates = {
    camping: [
      ['食物补给', people * 45, people * 65, '食物', '主食、零食、水果、应急补给'],
      ['饮料酒水', people * 18, people * 28, '酒水', '饮用水、饮料、啤酒'],
      ['露营布置', 120, 260, '布置', '桌布、氛围灯、装饰小物'],
      ['交通物流', 80, 180, '交通', '打车、搬运、停车费'],
    ],
    bar: [
      ['酒水套餐', people * 60, people * 90, '酒水', '酒水、软饮、冰块'],
      ['小食拼盘', people * 25, people * 40, '食物', '薯条、炸物、零食'],
      ['现场布置', 80, 180, '布置', '手牌、气球、拍照道具'],
    ],
    birthday: [
      ['生日蛋糕', 180, 360, '食物', '蛋糕、蜡烛、餐具'],
      ['饮料酒水', people * 20, people * 35, '酒水', '饮料、酒水、气泡水'],
      ['生日布置', 120, 260, '布置', '气球、桌布、拍照背景'],
    ],
  };
  const selected = templates[type.id] || [
    ['活动物料', people * 20, people * 35, '其他', '签到、贴纸、手卡、备用物资'],
    ['食物饮品', people * 35, people * 55, '食物', '小食、饮料、简单补给'],
    ['现场布置', 80, 180, '布置', '桌面、指引、氛围物料'],
  ];

  return selected.map(([name, low, high, category, description]) =>
    makeRecommendation({
      name,
      suggestion: `建议 ${money(low)}-${money(high)}`,
      category,
      description,
      amount: low,
      estimateLow: low,
      estimateHigh: high,
      note: `系统根据 ${type.name} · ${people} 人推荐，可按实际金额修改。`,
    }),
  );
}

function makeRecommendation({ name, suggestion, category, description, amount, estimateLow, estimateHigh, note }) {
  return {
    name,
    suggestion,
    category,
    description,
    estimateLow,
    estimateHigh,
    prefill: {
      name,
      category,
      amount,
      note,
    },
  };
}

function recommendationEstimateText(recommendations) {
  const low = recommendations.reduce((sum, item) => sum + (Number(item.estimateLow) || 0), 0);
  const high = recommendations.reduce((sum, item) => sum + (Number(item.estimateHigh) || 0), 0);
  if (!low && !high) return '';
  return `预计还需 ${money(low)} - ${money(high)}`;
}

function RecommendedPurchasesAccordion({ activity, activityType, recommendations, open, showAll, onToggle, onShowAll, onAdd }) {
  const visibleItems = showAll ? recommendations : recommendations.slice(0, 3);
  const hiddenCount = Math.max(recommendations.length - visibleItems.length, 0);
  const estimateText = recommendationEstimateText(recommendations);

  return (
    <section className="mx-5 mt-4 overflow-hidden rounded-[28px] bg-white/86 shadow-[0_14px_34px_rgba(82,98,135,0.1)] ring-1 ring-white/70 backdrop-blur-2xl">
      <button className="flex w-full items-center justify-between gap-3 p-4 text-left transition active:scale-[0.99]" onClick={onToggle}>
        <div className="min-w-0">
          <h2 className="text-[18px] font-black tracking-[-0.03em] text-[#151a38]">推荐采购</h2>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-[#747b91]">
            根据 {activity.peopleCount} 人{activityType.name}生成 · {recommendations.length} 项建议
          </p>
          {estimateText && <p className="mt-1 text-[12px] font-black text-[#5b5df7]">{estimateText}</p>}
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3f5fb] text-[#5b5df7] transition ${open ? '-rotate-90' : 'rotate-90'}`}>
          <ChevronRight size={18} strokeWidth={2.6} />
        </span>
      </button>
      {open && (
        <div className="border-t border-[#eef1f6] px-4 pb-4 pt-3">
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <RecommendedPurchaseRow key={item.name} item={item} onAdd={() => onAdd(item)} />
            ))}
          </div>
          {hiddenCount > 0 && (
            <button className="mt-3 h-10 w-full rounded-full bg-[#f4f6fb] text-[13px] font-black text-[#5b5df7]" onClick={onShowAll}>
              查看更多 {hiddenCount} 项
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function RecommendedPurchaseRow({ item, onAdd }) {
  return (
    <div className="rounded-[22px] bg-[#f7f9fd]/92 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-black text-[#151a38]">{item.name}</h3>
            <span className="rounded-full bg-white/88 px-2 py-1 text-[10px] font-black text-[#747b91]">类目：{item.category}</span>
          </div>
          <p className="mt-2 text-[15px] font-black tracking-[-0.03em] text-[#5b5df7]">{item.suggestion}</p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-[#747b91]">{item.description}</p>
        </div>
        <button className="shrink-0 rounded-full bg-[#eef2ff] px-3.5 py-2 text-[12px] font-black text-[#5b5df7] transition active:scale-[0.96]" onClick={onAdd}>
          添加
        </button>
      </div>
    </div>
  );
}

function PurchaseGroup({ title, purchases, onEditPurchase }) {
  if (!purchases.length) return null;

  return (
    <section>
      <h3 className="mb-2 px-1 text-[13px] font-black text-[#747b91]">{title}</h3>
      <div className="overflow-hidden rounded-[24px] bg-[#f7f9fd]/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {purchases.map((purchase) => (
          <PurchaseRow key={purchase.id} purchase={purchase} onClick={() => onEditPurchase(purchase.id)} />
        ))}
      </div>
    </section>
  );
}

function PurchaseRow({ purchase, onClick }) {
  const detailText = [purchase.category, purchase.platform].filter(Boolean).join(' · ') || purchase.category || '未分类';
  const quantity = Math.max(Number(purchase.quantity) || 1, 1);
  const unitAmount = (Number(purchase.amount) || 0) / quantity;
  const quantityText = `${quantity}笔 × ${money(unitAmount)}`;
  const metaText = [detailText, quantityText].filter(Boolean).join(' · ');
  const badges = [
    !purchase.isPaid ? { label: '未付款', tone: 'orange' } : null,
    !purchase.isArrived ? { label: '未到货', tone: 'amber' } : null,
    purchase.isReusable ? { label: '可复用', tone: 'purple' } : null,
  ].filter(Boolean);

  return (
    <button className="block w-full border-b border-[#e8edf5]/80 px-3.5 py-3 text-left transition last:border-b-0 active:bg-white/70" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate text-[15px] font-black text-[#151a38]">{purchase.name}</p>
            {badges.length > 0 && (
              <div className="flex shrink-0 items-center gap-1">
                {badges.map((badge) => <SmallBadge key={badge.label} tone={badge.tone}>{badge.label}</SmallBadge>)}
              </div>
            )}
          </div>
          <p className="mt-1.5 truncate text-[12px] font-semibold text-[#858da0]">{metaText}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <p className="text-[17px] font-black tracking-[-0.04em] text-[#151a38]">{money(purchase.amount)}</p>
          <ChevronRight size={15} className="text-[#b1b7c6]" />
        </div>
      </div>
    </button>
  );
}

function AssetRow({ asset }) {
  const value = assetTotalValue(asset);

  return (
    <div className="min-w-0 rounded-[22px] bg-[#f6f8fb]/90 p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-[17px] bg-white/82 text-[24px] shadow-sm">
        {assetIcon(asset.category)}
      </div>
      <p className="mt-2 truncate text-[12px] font-black text-[#151a38]">{asset.name}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#858da0]">{value ? money(value) : '-'}</p>
      <p className="mt-1 text-[10px] font-bold text-[#9aa1b3]">复用 {asset.reuseCount || 0} 次</p>
    </div>
  );
}

function AssetDetailRow({ asset, onClick }) {
  const value = assetUnitValue(asset);
  const valueText = value ? money(value) : '未估值';

  return (
    <button className="w-full rounded-[24px] bg-white/86 p-4 text-left shadow-[0_12px_30px_rgba(82,98,135,0.1)] transition active:scale-[0.99]" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-black tracking-[-0.03em]">{asset.name}</p>
          <p className="mt-1 text-[12px] font-semibold text-[#747b91]">{asset.category || '其他'} · 数量 {assetQuantity(asset)}</p>
          <p className="mt-2 text-[12px] font-semibold text-[#858da0]">已复用 {asset.reuseCount || 0} 次 · 最近使用 {asset.lastUsedAt?.slice(0, 10) || '暂无'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <p className={`text-[18px] font-black ${value ? 'text-[#151a38]' : 'text-[#9aa1b3]'}`}>{valueText}</p>
          <ChevronRight size={15} className="text-[#b1b7c6]" />
        </div>
      </div>
      {asset.note && <p className="mt-2 text-[12px] font-medium leading-5 text-[#747b91]">{asset.note}</p>}
    </button>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-[18px] bg-[#f5f7fb] px-3 py-3">
      <p className="text-[11px] font-bold text-[#858da0]">{label}</p>
      <p className="mt-1 text-[15px] font-black tracking-[-0.04em] text-[#151a38]">{value}</p>
    </div>
  );
}

function StatusLabel({ children, className = '' }) {
  return (
    <span className={`inline-flex h-8 min-w-[76px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[15px] font-semibold leading-none ${className}`}>
      {children}
    </span>
  );
}

function StatusStat({ label, value }) {
  return (
    <div className="rounded-[20px] bg-[#f5f7fb] px-3 py-3 text-center">
      <p className="text-[18px] font-black tracking-[-0.04em] text-[#151a38]">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-[#858da0]">{label}</p>
    </div>
  );
}

function MiniFinanceCard({ label, value, tone }) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-600',
  }[tone];

  return (
    <div className={`rounded-[22px] p-4 text-left ${toneClass}`}>
      <p className="text-[13px] font-bold opacity-70">{label}</p>
      <p className="mt-2 text-[24px] font-black leading-none tracking-[-0.055em]">{value}</p>
    </div>
  );
}

function SmallBadge({ children, tone = 'orange' }) {
  const toneClass = {
    orange: 'bg-orange-50/85 text-orange-600',
    amber: 'bg-amber-50/90 text-amber-600',
    purple: 'bg-violet-50/90 text-violet-600',
    green: 'bg-emerald-50/85 text-emerald-600',
  }[tone] || 'bg-[#eef2ff] text-[#5b5df7]';

  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium leading-none ${toneClass}`}>{children}</span>;
}

function SimpleTitle({ title, subtitle }) {
  return (
    <section className="px-5 pb-5 pt-4">
      <h1 className="text-[31px] font-black leading-none tracking-[-0.05em]">{title}</h1>
      {subtitle && <p className="mt-2 text-[13px] font-medium text-[#747b91]">{subtitle}</p>}
    </section>
  );
}

function PageHeader({ title, subtitle, onBack, compact = false, action }) {
  if (compact) {
    return (
      <header className="mb-6 flex items-center gap-4 px-5 pt-4">
        <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#151a38] shadow-[0_8px_24px_rgba(82,98,135,0.1)]" onClick={onBack} aria-label="返回">
          <ArrowLeft size={20} />
        </button>
        <h1 className="min-w-0 flex-1 text-[22px] font-black leading-none tracking-[-0.045em]">{title}</h1>
        {action}
      </header>
    );
  }

  return (
    <header className="mb-6 flex items-center gap-3 px-5 pt-4">
      <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#151a38] shadow-[0_8px_24px_rgba(82,98,135,0.1)]" onClick={onBack} aria-label="返回">
        <ArrowLeft size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-[28px] font-black leading-none tracking-[-0.045em]">{title}</h1>
        {subtitle && <p className="mt-2 truncate text-[13px] font-medium text-[#747b91]">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

function IconButton({ icon, label, onClick, subtle = false }) {
  return (
    <button className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#5b5df7] ${subtle ? 'bg-white/72 shadow-[0_8px_22px_rgba(82,98,135,0.08)] backdrop-blur-2xl' : 'bg-white shadow-[0_8px_24px_rgba(82,98,135,0.1)]'}`} onClick={onClick} aria-label={label}>
      {icon}
    </button>
  );
}

function DateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const [visibleMonth, setVisibleMonth] = useState(selectedDate || new Date());
  const calendarDays = buildCalendarDays(visibleMonth);
  const displayValue = value ? value.replaceAll('-', ' / ') : '年 / 月 / 日';
  const monthTitle = `${visibleMonth.getFullYear()}年${String(visibleMonth.getMonth() + 1).padStart(2, '0')}月`;

  function moveMonth(delta) {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1));
  }

  function selectDate(date) {
    onChange(toDateInputValue(date));
    setVisibleMonth(date);
    setOpen(false);
  }

  return (
    <div className="relative block">
      <span className="mb-2 block text-[14px] font-black text-[#151a38]">{label}</span>
      <button
        type="button"
        className="relative flex h-14 w-full items-center justify-between rounded-[20px] bg-white/88 px-4 text-left shadow-[0_10px_28px_rgba(82,98,135,0.08)] ring-1 ring-transparent transition active:scale-[0.99] focus:outline-none focus:ring-[#7375ff]/35"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`text-[16px] font-black ${value ? 'text-[#151a38]' : 'text-[#b7bdcb]'}`}>{displayValue}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3f5fa] text-[#5b6478]">
          <CalendarDays size={17} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[82px] z-[80] rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_22px_60px_rgba(82,98,135,0.18)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f6fb] text-[#151a38]" onClick={() => moveMonth(-1)} aria-label="上个月">
              <ChevronLeft size={18} />
            </button>
            <p className="text-[15px] font-black tracking-[-0.02em] text-[#151a38]">{monthTitle}</p>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f6fb] text-[#151a38]" onClick={() => moveMonth(1)} aria-label="下个月">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <span key={day} className="py-1 text-[12px] font-black text-[#9aa1b3]">{day}</span>
            ))}
            {calendarDays.map((date) => {
              const inMonth = date.getMonth() === visibleMonth.getMonth();
              const selected = sameDay(date, selectedDate);
              const today = sameDay(date, new Date());
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={`relative grid h-10 place-items-center rounded-full text-[14px] font-black transition active:scale-95 ${
                    selected ? 'bg-[#5b5df7] text-white shadow-[0_8px_18px_rgba(91,93,247,0.24)]' : inMonth ? 'text-[#151a38] hover:bg-[#f2f4fb]' : 'text-[#c1c6d3]'
                  }`}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                  {today && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#5b5df7]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between">
            <button type="button" className="rounded-full px-3 py-2 text-[13px] font-black text-[#7b8498]" onClick={() => { onChange(''); setOpen(false); }}>
              清除
            </button>
            <button type="button" className="rounded-full bg-[#eef2ff] px-3 py-2 text-[13px] font-black text-[#5b5df7]" onClick={() => selectDate(new Date())}>
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-black text-[#151a38]">{label}</span>
      <input
        className="h-14 w-full rounded-[20px] border-0 bg-white/86 px-4 text-[16px] font-bold text-[#151a38] shadow-[0_10px_28px_rgba(82,98,135,0.08)] outline-none ring-1 ring-transparent transition placeholder:text-[#b7bdcb] focus:ring-[#7375ff]/35"
        type={type}
        value={value}
        placeholder={placeholder}
        min={type === 'number' ? '0' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, hideLabel = false }) {
  return (
    <label className="block">
      {!hideLabel && <span className="mb-2 block text-[14px] font-black text-[#151a38]">{label}</span>}
      <textarea
        className="min-h-[92px] w-full resize-none rounded-[20px] border-0 bg-white/86 px-4 py-3 text-[15px] font-bold text-[#151a38] shadow-[0_10px_28px_rgba(82,98,135,0.08)] outline-none ring-1 ring-transparent transition placeholder:text-[#b7bdcb] focus:ring-[#7375ff]/35"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ActionSheet({ title, actions = [], dangerActions = [], onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-[rgba(15,23,42,0.18)] px-4 pb-[max(18px,env(safe-area-inset-bottom))]" onClick={onCancel}>
      <div className="mx-auto w-full max-w-[390px]" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-2.5 h-[4px] w-9 rounded-full bg-white/70" />
        <div className="overflow-hidden rounded-[21px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.09)]">
          {actions.map((action) => (
            <button
              key={action.label}
              className="block h-[56px] w-full px-4 text-center text-[17px] font-semibold text-[#151a38] transition active:bg-[#f6f8fb]"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
        {dangerActions.length > 0 && (
          <div className="mt-2.5 overflow-hidden rounded-[21px] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
            {dangerActions.map((action) => (
              <button
                key={action.label}
                className="block h-[56px] w-full px-4 text-center text-[17px] font-semibold text-red-500 transition active:bg-red-50"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        <button className="mt-2.5 h-[56px] w-full rounded-[21px] bg-white text-[17px] font-semibold text-[#151a38] shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition active:bg-[#f6f8fb]" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, description, primary, secondary, onPrimary, onSecondary, destructive = false }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#080d2b]/20 px-8 backdrop-blur-sm">
      <div className="w-full max-w-[320px] rounded-[28px] bg-white p-5 text-center shadow-[0_24px_70px_rgba(35,43,73,0.2)]">
        <h2 className="text-[20px] font-black tracking-[-0.04em] text-[#151a38]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[240px] text-[13px] font-semibold leading-5 text-[#747b91]">{description}</p>
        <button className={`mt-5 h-12 w-full rounded-full text-[15px] font-black text-white ${destructive ? 'bg-red-500' : 'bg-[#5b5df7]'}`} onClick={onPrimary}>{primary}</button>
        <button className="mt-2 h-11 w-full rounded-full text-[14px] font-black text-[#747b91]" onClick={onSecondary}>{secondary}</button>
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      className="flex h-14 w-full items-center justify-center rounded-full bg-[#5b5df7] text-[16px] font-black text-white shadow-[0_10px_24px_rgba(91,93,247,0.22)] transition active:scale-[0.99] disabled:bg-[#cfd3df] disabled:shadow-none"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ShowcasePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_12%,rgba(234,248,241,0.95),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(238,240,255,0.95),transparent_34%),linear-gradient(135deg,#F9FAFF_0%,#F7F8FA_46%,#F2F0FF_100%)] px-5 py-8 text-[#090E2B]">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[980px] flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
        <div className="relative shrink-0">
          <div className="absolute -left-10 top-20 h-44 w-44 rounded-full bg-[#EAF8F1]/70 blur-3xl" />
          <div className="absolute -right-12 bottom-28 h-56 w-56 rounded-full bg-[#EEF0FF]/90 blur-3xl" />
          <div className="relative rounded-[56px] bg-[#111827] p-[10px] shadow-[0_38px_90px_rgba(30,41,59,0.22)]">
            <div className="absolute left-1/2 top-3 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-[#0b1020]" />
            <div className="h-[760px] w-[390px] overflow-hidden rounded-[46px] bg-[#F7F8FA]">
              <ShowcasePhoneScreen />
            </div>
          </div>
        </div>

        <aside className="max-w-[360px] text-center md:text-left">
          <p className="text-[13px] font-black tracking-[0.18em] text-[#635BFF]">ACTIVITY LEDGER</p>
          <h1 className="mt-4 text-[38px] font-black leading-[1.05] tracking-[-0.055em] text-[#090E2B] md:text-[48px]">
            活动经营账本
          </h1>
          <p className="mt-4 text-[16px] font-semibold leading-7 text-[#6B7280]">
            从第一场活动开始，记录收入、采购成本和可复用资产。
          </p>
          <div className="mt-7 inline-flex rounded-full bg-white/62 px-5 py-3 text-[14px] font-black text-[#635BFF] shadow-[0_12px_30px_rgba(99,91,255,0.08)] ring-1 ring-white/80 backdrop-blur-2xl">
            适合活动主理人的轻账本
          </div>
        </aside>
      </section>
    </main>
  );
}

function ShowcasePhoneScreen() {
  const previewActivity = {
    id: 'showcase-hotpot',
    name: '周末火锅局',
    date: toDateInputValue(new Date()),
    peopleCount: 10,
    unitPrice: 288,
    expectedIncome: 2880,
    type: { id: 'party', name: '轰趴', icon: '🎉' },
    status: 'preparing',
    purchases: [
      {
        id: 'showcase-drinks',
        amount: 216,
        isReusable: false,
        isPaid: true,
        isArrived: true,
      },
    ],
    createdAt: new Date().toISOString(),
  };
  const summary = getMonthlySummary([previewActivity], new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  return (
    <div className="relative min-h-full bg-[#F7F8FA] pb-28 text-[#080d2b]">
      <StatusBar />
      <section className="px-7 pt-8">
        <h2 className="text-[31px] font-black leading-none text-[#080d2b]">活动经营账本</h2>
      </section>
      <MonthlyOverviewCard
        month={formatMonth(new Date())}
        income={summary.income}
        cost={summary.cost}
        profit={summary.profit}
        onMonthClick={() => {}}
      />
      <section className="mt-6">
        <div className="mb-1 flex w-full items-center gap-1 px-9 text-left">
          <h3 className="text-[20px] font-black tracking-[-0.04em]">进行中的活动</h3>
          <ChevronRight size={17} className="text-[#aeb4c3]" strokeWidth={2.5} />
        </div>
        <div className="px-5 pt-2">
          <ActivityBusinessCard activity={previewActivity} onClick={() => {}} />
        </div>
      </section>
      <div className="absolute bottom-[118px] right-5 grid h-[62px] w-[62px] place-items-center rounded-full bg-[#5b5cf6] text-white shadow-[0_16px_34px_rgba(91,92,246,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/30">
        <Plus size={31} strokeWidth={2.8} />
      </div>
      <div className="absolute bottom-3 left-0 right-0 px-4">
        <BottomTabs activeTab="home" onChange={() => {}} />
      </div>
    </div>
  );
}

function RootRouter() {
  return window.location.pathname === '/showcase' ? <ShowcasePage /> : <App />;
}

createRoot(document.getElementById('root')).render(<RootRouter />);
