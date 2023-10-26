import chai from "chai";
import chaiHttp from "chai-http";
import sinon from "sinon";
import utils from "./utils";
import session from "next-auth";

chai.use(chaiHttp);
chai.should();
const app = "http://localhost:3000/";

describe("Home", () => {
    describe("GET / unauthenticated", () => {
        it("should return valid page", (done) => {
            chai.request(app)
                .get("/")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a("object");
                    done();
                });
        });

        it("should show the login form", (done) => {
            chai.request(app)
                .get("/")
                .end((err, res) => {
                    res.text.should.include(
                        '<form action="/login?next=/" method="POST"'
                    );
                    res.text.should.include('<input name="emailInput"');
                    res.text.should.include(
                        '<button class="button" id="primary_email_button">'
                    );
                    done();
                });
        });
    });
    describe("GET / authenticated", () => {
        let getToken;

        beforeEach(() => {
            getToken = sinon.stub(session, "getServerSession");
            getToken.returns({
                user: {
                    name: "membre.actif",
                },
            });
        });

        afterEach(() => {
            getToken.restore();
        });

        it("should redirect to community page", (done) => {
            chai.request(app)
                .get("/")
                .redirects(0)
                .end((err, res) => {
                    res.should.have.status(302);
                    res.header.location.should.equal("/account");
                    done();
                });
        });
    });
});
