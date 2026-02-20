export default function Footer() {
  return (
    <footer id="page-footer" className="bg-body-light">
      <div className="content py-3">
        <div className="row fs-sm">
          <div className="col-sm-6 order-sm-2 py-1 text-center text-sm-end">
            Conçu par <a className="fw-semibold" href="https://asconsulting-ci.com/" target="_blank">AS Consulting</a>
          </div>
          <div className="col-sm-6 order-sm-1 py-1 text-center text-sm-start">
            <span className="fw-semibold" style={{ color: 'blue' }}>DLMS</span> &copy; <span data-toggle="year-copy"></span>
          </div>
        </div>
      </div>
    </footer>
  )
}
