import { filterFirstName, getInitials } from "../../utils/validate"



const ProfileInfo = ({userInfo, onLogout}:any) => {
  return (
    userInfo && <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center rounded-full text-slate-950 font-sans bg-white/90">
            {getInitials( userInfo ? userInfo.username: '')}
        </div>
        <div>
            <p className="text-sm font-medium">{`Hello, ${filterFirstName(userInfo? userInfo.username :'')}`}</p>
            <button className="text-sm text-slate-700 underline" onClick={onLogout}>Logout</button>
        </div>
    </div>
  )
}

export default ProfileInfo