// pages/index.js
// Redirects to the static app in /public/index.html
export async function getServerSideProps({ res }) {
  res.writeHead(302, { Location: '/index.html' });
  res.end();
  return { props: {} };
}

export default function Home() {
  return null;
}
