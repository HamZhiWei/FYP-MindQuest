import { NavLink } from 'react-router-dom';
import { getStaffName, logout } from '../api/adminApi';
import { IoBarChart } from "react-icons/io5";
import { BsBarChartSteps } from "react-icons/bs";
import { MdInsights } from "react-icons/md";
import { FaFlag } from "react-icons/fa6";
import { FaBalanceScaleRight } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";
import { IoIosPaper } from "react-icons/io";
import { BiExport } from "react-icons/bi";

const logoPath = '/assets/ui/logo.png';

const NAV = [
  {
    section: 'Analytics',
    items: [
      { label: 'Overview',           path: '/overview',         icon: <IoBarChart /> },
      { label: 'Indicators',         path: '/indicators',       icon: <BsBarChartSteps /> },
      { label: 'PSS-10 Correlation', path: '/pss10-correlation',icon: <MdInsights /> },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'Flagged Sessions', path: '/flagged', icon: <FaFlag /> },
      { label: 'Scoring Weights',  path: '/weights', icon: <FaBalanceScaleRight /> },
      { label: 'Wellbeing Tips',   path: '/tips',    icon: <MdTipsAndUpdates /> },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Audit Log',   path: '/audit-log', icon: <IoIosPaper /> },
      { label: 'Export Data', path: '/export',    icon: <BiExport /> },
    ],
  },
];

export default function Sidebar() {
  const staffName = getStaffName();

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src={logoPath} alt="Logo" className="h-8 w-8" />
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">MindQuest Admin</p>
            <p className="text-xs text-gray-400">Analytics Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-2">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ label, path, icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-medium text-gray-700 truncate">{staffName}</p>
        <p className="text-xs text-gray-400 mb-1.5">Staff · Faculty of Computing</p>
        <button
          type="button"
          onClick={() => { void logout(); }}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
