module.exports = {
  timeAgo(iso){
    if(!iso) return '—';
    const diff = (Date.now() - new Date(iso).getTime())/1000;
    if(diff < 60) return 'just now';
    if(diff < 3600) return Math.floor(diff/60) + 'm ago';
    if(diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  },
  cleanStageName(name){
    if(!name) return '';
    return name.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u2705\u2709]/gu, '').trim();
  }
};
