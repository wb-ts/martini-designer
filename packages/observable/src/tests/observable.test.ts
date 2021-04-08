import { Observable, ObservableArray, PropertyChangeEvent } from "../common";

test("Setting a value should trigger an event", () => {
    const person = new Person({
        firstName: "Frodo",
        lastName: "Baggins"
    });
    let event: PropertyChangeEvent | undefined;
    person.addListener(Person.P_FIRST_NAME, e => {
        event = e;
    });
    person.firstName = "Bilbo";
    expect(event).not.toBeUndefined();
    expect(event?.propertyName).toBe(Person.P_FIRST_NAME);
    expect(event?.sourcePropertyName).toBe(Person.P_FIRST_NAME);
    expect(event?.source).toBe(person);
    expect(event?.oldValue).toEqual("Frodo");
    expect(event?.newValue).toEqual("Bilbo");
});

test("Setting unrelated value should trigger an event", () => {
    const person = new Person({
        firstName: "Frodo",
        lastName: "Baggins"
    });
    let event: PropertyChangeEvent | undefined;
    person.addListener(Person.P_LAST_NAME, e => {
        event = e;
    });
    person.firstName = "Bilbo";
    expect(event).toBeUndefined();
});

test("Modifying an observed array triggers events", () => {
    const person = new Person({
        firstName: "Frodo",
        lastName: "Baggins"
    });
    let event: PropertyChangeEvent | undefined;
    person.addListener(Observable.P_CHANGED, e => {
        event = e;
    });
    const newPerson = new Person({
        firstName: "Samwise",
        lastName: "Gamegee"
    });
    person.friends.push(newPerson);
    expect(event).not.toBeUndefined();
    expect(event?.source).toBe(person);
    expect(event?.propertyName).toBe(Observable.P_CHANGED);
    expect(event?.sourcePropertyName).toBe(Observable.P_CHANGED);
    expect(event?.newValue).toStrictEqual([newPerson]);
});

test("Setting a value on a nested object should trigger an event", () => {
    const frodo = new Person({
        firstName: "Frodo",
        lastName: "Baggins"
    });
    const sam = new Person({
        firstName: "Samwise",
        lastName: "Gamegee"
    });
    frodo.friends.push(sam);
    let event: PropertyChangeEvent | undefined;
    frodo.addListener(Observable.P_CHANGED, e => {
        event = e;
    });
    sam.title = "Mayor of the Shire";
    expect(event).not.toBeUndefined();
    expect(event?.source).toBe(sam);
    expect(event?.propertyName).toBe(Observable.P_CHANGED);
    expect(event?.sourcePropertyName).toBe(Person.P_TITLE);
    expect(event?.oldValue).toBe("");
    expect(event?.newValue).toBe("Mayor of the Shire");
});

class Person extends Observable {
    static readonly P_FIRST_NAME = "firstName";
    static readonly P_LAST_NAME = "lastName";
    static readonly P_TITLE = "title";

    private _firstName = "";
    private _lastName = "";
    private _title = "";
    readonly friends = this.observeArray(new ObservableArray<Person>());

    constructor(init?: Partial<Person>) {
        super();
        if (init) Object.assign(this, init);
    }

    get firstName(): string {
        return this._firstName;
    }

    set firstName(firstName: string) {
        this.firePropertyChange(Person.P_FIRST_NAME, this._firstName, (this._firstName = firstName));
    }

    get lastName(): string {
        return this._lastName;
    }

    set lastName(lastName: string) {
        this.firePropertyChange(Person.P_LAST_NAME, this._lastName, (this._lastName = lastName));
    }

    get title(): string {
        return this._title;
    }

    set title(title: string) {
        this.firePropertyChange(Person.P_TITLE, this._title, (this._title = title));
    }
}
