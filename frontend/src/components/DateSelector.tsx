import { DayPicker } from 'react-day-picker';
import moment from 'moment';
import { MdClose, MdOutlineDateRange } from 'react-icons/md';
import { useState } from 'react';

const DateSelector = ({ date, setDate }: any) => {
  const [openDatePicker, setOpenDatePicker] = useState(false);

  return (
    <div>
      <button
        className="inline-flex items-center gap-2 text-[13px] font-medium text-lime-500 bg-lime-200/40 hover:bg-lime-200/70 rounded px-2 py-1 cursor-pointer"
        onClick={() => setOpenDatePicker(true)}
      >
        <MdOutlineDateRange className="text-lg" />
        {date ? moment(date).format('MMM DD, YYYY') : moment().format('MMM DD, YYYY')}
      </button>

      {openDatePicker && (
        <div
          className="
            overflow-y-scroll 
            scrollbar        /* <-- add this */
            p-5 
            bg-lime-50/80 
            rounded-lg 
            relative 
            pt-9
          "
        >
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center bg-lime-100 hover:bg-lime-100 absolute top-2 right-2"
            onClick={() => setOpenDatePicker(false)}
          >
            <MdClose className="text-xl text-lime-500" />
          </button>

          <DayPicker
            captionLayout="label"
            mode="single"
            selected={date}
            onSelect={setDate}
            pagedNavigation
          />
        </div>
      )}
    </div>
  );
};

export default DateSelector;