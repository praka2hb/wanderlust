import moment from 'moment'
import { FaHeart } from 'react-icons/fa6'
import { GrMapLocation } from 'react-icons/gr'

const TravelStoryCard = ({ imgUrl, title, story, date, visitedLocation, isFavourite, onFavouriteClick, onClick }: any) => {
      const getDirectImageUrl = (url: string): string => {
        if (!url) return '';
        try {
          // Extract fileId from various Google Drive URL formats
          let fileId: string | null = null;
          if (url.includes('/file/d/')) {
            const idMatch = url.match(/\/file\/d\/([^\/]+)\//);
            fileId = idMatch?.[1] || null;
          } else if (url.includes('id=')) {
            fileId = new URL(url).searchParams.get('id');
          }
          if (fileId) {
            console.debug('Drive fileId:', fileId);
            // Use export=view for direct image display
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
          }
          console.warn('No fileId found in URL:', url);
          return url; // Fallback to original URL
        } catch (e) {
          console.error('getDirectImageUrl error:', e);
          return url; // Fallback to original URL
        }
      };
  return (
    <div className='border rounded-lg overflow-hidden hover:shadow-lg bg-white/40 hover:shadow-slate-200 transition-all ease-in-out duration-300 relative cursor-pointer'>
        <img
        src={getDirectImageUrl(imgUrl)}
        alt={title}
        className="w-full h-56 object-cover rounded-lg"
        onClick={onClick}
        onError={e => {
          console.error('Image failed to load, showing placeholder')
          e.currentTarget.src = 'https://placehold.co/600x400?text=Image+Unavailable'
        }}
      />
        <button className='flex justify-center items-center absolute top-4 right-4 h-10 w-10 bg-black/40 rounded-lg border-white/30 border-2'>
            <FaHeart className={`text-[22px] test-slate-300 cursor-pointer hover:text-lime-400 ${isFavourite ? 'text-lime-400' : "text-white"}`} onClick={onFavouriteClick}/>
        </button>
        <div className='p-4' onClick={onClick}>
            <div className='flex items-center gap-3'>
                <div className='flex-1'>
                    <h6 className='text-sm font-medium'>
                        {title}
                    </h6>
                    <span className='text-xs text-slate-500 font-medium'>
                        {date ? moment(date).format('MMM DD, YYYY') : '-'}
                    </span>
                </div>
            </div>
            <p className='text-sm text-slate-600 mt-2'>{story?.slice(0,60)+ ".."}</p>
            <div className='inline-flex items-center gap-2 text-[13px]  text-lime-600 bg-lime-200/40 rounded mt-3 px-2 py-1'>
                <GrMapLocation className='text-sm' />
                {visitedLocation.map((item: any,index: any) => visitedLocation.length == index + 1 ? `${item}` : `${item} ,`)}
            </div>
        </div>
    </div>
  )
}

export default TravelStoryCard