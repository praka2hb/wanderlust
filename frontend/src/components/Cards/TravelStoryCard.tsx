import moment from 'moment'
import { FaHeart } from 'react-icons/fa6'
import { GrMapLocation } from 'react-icons/gr'

interface Props {
  imgUrl?: string
  title?: string
  story?: string
  date?: string
  visitedLocation?: string[]
  isFavourite?: boolean
  onFavouriteClick?: () => void
  onClick?: () => void
}

const TravelStoryCard = ({
  imgUrl = '',
  title = 'Untitled',
  story = '',
  date,
  visitedLocation = [],
  isFavourite = false,
  onFavouriteClick = () => {},
  onClick = () => {}
}: Props) => {
  return (
    <div
      className="border rounded-lg overflow-hidden hover:shadow-lg bg-white/40 hover:shadow-slate-200 transition-all duration-300 relative cursor-pointer"
      onClick={onClick}
    >
      <img
        src={imgUrl}
        alt={title}
        className="w-full h-56 object-cover"
        onError={e => {
          e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Unavailable'
        }}
      />

      <button
        onClick={e => {
          e.stopPropagation()          // prevent card click
          onFavouriteClick()
        }}
        className="absolute top-4 right-4 h-10 w-10 bg-black/40 rounded-lg border-2 border-white/30 flex items-center justify-center"
      >
        <FaHeart
          className={`text-[22px] ${
            isFavourite ? 'text-lime-600' : 'text-slate-300'
          } hover:text-lime-600`}
        />
      </button>

      <div className="p-4">
        <h6 className="text-sm font-medium">{title}</h6>
        <span className="text-xs text-slate-500 font-medium block">
          {date ? moment(date).format('MMM DD, YYYY') : '-'}
        </span>
        <p className="text-sm text-slate-600 mt-2">{story.slice(0, 60)}…</p>
        {visitedLocation.length > 0 && (
          <div className="inline-flex items-center gap-1 text-xs text-lime-600 bg-lime-200/40 rounded mt-3 px-2 py-1">
            <GrMapLocation className="text-sm" />
            <span>{visitedLocation.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TravelStoryCard