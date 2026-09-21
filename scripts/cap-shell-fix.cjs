// Some restricted Windows runners cannot resolve os.userInfo(). Capacitor only
// uses it to detect a shell, so provide the current command shell as a fallback.
const os=require('node:os'),native=os.userInfo;
os.userInfo=(...args)=>{try{return native(...args);}catch{return {username:'builder',uid:-1,gid:-1,shell:process.env.ComSpec||'cmd.exe',homedir:process.cwd()};}};
