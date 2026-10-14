import React from 'react';
import { Plus, Edit3, Trash2, FolderTree, BookOpen, GraduationCap, Video, Users } from 'lucide-react';
import { CatalogItem, CatalogType } from '../types';

interface Props {
  catalogs: CatalogItem[];
  onNewCatalog: (type: CatalogType) => void;
  onEditCatalog: (item: CatalogItem) => void;
  onDeleteCatalog: (id: number) => void;
}

export const CatalogsView: React.FC<Props> = ({
  catalogs,
  onNewCatalog,
  onEditCatalog,
  onDeleteCatalog,
}) => {
  const catalogConfigs: Record<
    CatalogType,
    { title: string; subtitle: string; icon: any; color: string }
  > = {
    teachers: {
      title: 'المدرسين (Teachers)',
      subtitle: 'قائمة مدرسي المنصة ومقدمي الشروحات',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    grades: {
      title: 'الصفوف الدراسية (Grades)',
      subtitle: 'المراحل الابتدائية والإعدادية والثانوية',
      icon: GraduationCap,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    subjects: {
      title: 'المواد التعليمية (Subjects)',
      subtitle: 'المواد الدراسية باللغات المختلفة (عربي/لغات)',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    lectures: {
      title: 'الحصص والدروس (Lectures)',
      subtitle: 'تسميات وترتيب الحصص والملخصات',
      icon: Video,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">القوائم المرجعية الأساسية</h2>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المدرسين والصفوف والمواد وأرقام الحصص المستخدمة في ربط وجداول المهام.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(catalogConfigs) as CatalogType[]).map((type) => {
          const config = catalogConfigs[type];
          const items = catalogs
            .filter((c) => c.type === type)
            .sort((a, b) => a.label.localeCompare(b.label, 'ar'));
          const Icon = config.icon;

          return (
            <div
              key={type}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{config.title}</h3>
                    <p className="text-[11px] text-gray-400">{config.subtitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => onNewCatalog(type)}
                  className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 flex-1 overflow-y-auto max-h-[300px] divide-y divide-gray-100">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="py-2.5 px-3 flex items-center justify-between gap-2 hover:bg-gray-50/80 rounded-xl transition-colors group"
                    >
                      <span className="text-xs font-medium text-gray-800">{item.label}</span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditCatalog(item)}
                          className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-white"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل تريد بالتأكيد حذف "${item.label}"؟`)) {
                              onDeleteCatalog(item.id);
                            }
                          }}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-white"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    لا توجد عناصر مضافة بعد في هذه القائمة.
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50/70 px-5 py-2.5 border-t border-gray-100 text-[11px] text-gray-500 font-semibold flex justify-between">
                <span>إجمالي العناصر المسجلة</span>
                <span className="font-mono text-indigo-600 font-bold">{items.length} عنصر</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
