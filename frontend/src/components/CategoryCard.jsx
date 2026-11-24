/**
 * src/components/CategoryCard.jsx
 * Clickable event category card routing to filtered Explore Events.
 */

import { useNavigate } from 'react-router-dom';
import {
  FiMusic,
  FiHeart,
  FiFeather,
  FiSun,
  FiCpu,
  FiLayers,
  FiAward,
  FiSmile,
  FiBriefcase,
  FiBookOpen,
  FiCalendar,
} from 'react-icons/fi';

const ICON_MAP = {
  FiMusic,
  FiHeart,
  FiFeather,
  FiSun,
  FiCpu,
  FiLayers,
  FiAward,
  FiSmile,
  FiBriefcase,
  FiBookOpen,
  FiCalendar,
};

export default function CategoryCard({ category }) {
  const navigate = useNavigate();
  const IconComponent = ICON_MAP[category.icon] || FiCalendar;

  return (
    <button
      type="button"
      onClick={() => navigate(`/events?category=${encodeURIComponent(category.name)}`)}
      className="ev-category-card"
    >
      <div className="ev-category-icon">
        <IconComponent size={20} />
      </div>
      <h3 className="h6 fw-bold mb-1 text-dark">{category.name}</h3>
      <p className="small text-muted mb-3" style={{ lineHeight: 1.45 }}>
        {category.description}
      </p>
      <span className="mt-auto small fw-semibold ev-num" style={{ color: 'var(--ev-primary)' }}>
        {category.eventCount ?? 0} {category.eventCount === 1 ? 'Event' : 'Events'} →
      </span>
    </button>
  );
}
